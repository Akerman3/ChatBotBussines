import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Minus, Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { getProfilePriceWithIVA } from '../utils/priceCalculations';
import { useSyncedState } from '../hooks/useSyncedState';
import { usePriceDatabase } from '../hooks/usePriceDatabase';

interface Profile {
  name: string;
  colors: {
    [key: string]: {
      price6m: string;
      pricePerM: string;
    };
  };
}

interface SelectedProfile {
  name: string;
  color: string;
  price6m: number;
  pricePerM: number;
  quantity: number;
  chargingMethod: 'complete' | 'meter';
  id?: string;
}

interface ProfileSearchAndSelectionProps {
  profiles: Profile[];
  selectedProfiles: SelectedProfile[];
  onSelectedProfilesChange: (profiles: SelectedProfile[]) => void;
  lineType?: 'L2' | 'L3' | 'all';
  availableColors: string[];
}

export function ProfileSearchAndSelection({
  profiles,
  selectedProfiles,
  onSelectedProfilesChange,
  lineType = 'L3',
  availableColors
}: ProfileSearchAndSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState<number | null>(null);
  const [defaultChargingMethod, setDefaultChargingMethod] = useState<'complete' | 'meter'>(() => {
    const savedMethod = localStorage.getItem('defaultChargingMethod');
    return (savedMethod as 'complete' | 'meter') || 'complete';
  });
  const [pricesUpdated, setPricesUpdated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Estado para el porcentaje de IVA
  const [materialIvaPercentage] = useSyncedState<number>('materialIvaPercentage', 16);

  // Hook para detectar cambios en la base de datos de precios
  const { profiles: latestProfiles, lastUpdate } = usePriceDatabase();

  // Filter profiles by line type
  const filteredProfiles = profiles.filter(item => {
    if (lineType === 'all') {
      return true; // Show all profiles
    } else if (lineType === 'L2') {
      return item.name.includes('_L2');
    } else {
      return item.name.includes('_L3');
    }
  });

  // Filter search results when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // IMPORTANTE: Permitimos agregar el mismo perfil múltiples veces
    // NO filtramos los perfiles que ya están seleccionados
    const results = filteredProfiles.filter(item => {
      return item.name.toLowerCase().includes(normalizedSearch);
    });

    setSearchResults(results);
    setShowResults(true);
  }, [searchTerm, filteredProfiles]);

  // Save default charging method to localStorage
  useEffect(() => {
    localStorage.setItem('defaultChargingMethod', defaultChargingMethod);
  }, [defaultChargingMethod]);

  // Actualizar precios cuando cambie la base de datos o el IVA
  useEffect(() => {
    if (selectedProfiles.length === 0 || latestProfiles.length === 0) return;

    let hasUpdates = false;
    const updatedProfiles = selectedProfiles.map(selectedProfile => {
      // Buscar el perfil en la base de datos actualizada
      const dbProfile = latestProfiles.find(p => p.name === selectedProfile.name);

      if (!dbProfile) {
        return selectedProfile;
      }

      // Obtener precios actualizados con IVA
      const updatedPrices = getProfilePriceWithIVA(
        selectedProfile.name,
        selectedProfile.color,
        latestProfiles,
        materialIvaPercentage
      );

      // Verificar si los precios cambiaron
      if (
        Math.abs(updatedPrices.price6m - selectedProfile.price6m) > 0.01 ||
        Math.abs(updatedPrices.pricePerM - selectedProfile.pricePerM) > 0.01
      ) {
        hasUpdates = true;
        return {
          ...selectedProfile,
          price6m: updatedPrices.price6m,
          pricePerM: updatedPrices.pricePerM
        };
      }

      return selectedProfile;
    });

    if (hasUpdates) {
      onSelectedProfilesChange(updatedProfiles);
      setPricesUpdated(true);
      setTimeout(() => setPricesUpdated(false), 3000);
    }
  }, [lastUpdate, materialIvaPercentage, latestProfiles]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileSelect = (profile: Profile) => {
    // Default to first color that has a price
    const availableColor = availableColors.find(color => {
      const colorData = profile.colors[color];
      return colorData && parseFloat(colorData.price6m) > 0;
    }) || availableColors[0];

    // Obtener precios con IVA usando la función de utilidades
    const pricesWithIVA = getProfilePriceWithIVA(profile.name, availableColor, [profile], materialIvaPercentage);

    const newProfile: SelectedProfile = {
      id: crypto.randomUUID(),
      name: profile.name,
      color: availableColor,
      price6m: pricesWithIVA.price6m,
      pricePerM: pricesWithIVA.pricePerM,
      quantity: 1,
      chargingMethod: defaultChargingMethod
    };

    onSelectedProfilesChange([...selectedProfiles, newProfile]);
    
    // Limpiar el término de búsqueda y ocultar resultados después de agregar
    setSearchTerm('');
    setShowResults(false);
    
    // Keep focus on the search input after adding an item
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleRemoveProfile = (index: number) => {
    onSelectedProfilesChange(selectedProfiles.filter((_, i) => i !== index));
    // Mantener el foco en el campo de búsqueda después de eliminar
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleQuantityChange = (index: number, newQuantity: number) => {
    // Permitir valores de 0 o mayores
    if (newQuantity < 0) return;
    
    const updated = [...selectedProfiles];
    updated[index].quantity = newQuantity;
    onSelectedProfilesChange(updated);
  };
  
  const handleChargingMethodChange = (index: number, method: 'complete' | 'meter') => {
    const updated = [...selectedProfiles];
    updated[index].chargingMethod = method;
    onSelectedProfilesChange(updated);
  };

  const handleColorChange = (index: number, color: string) => {
    const updated = [...selectedProfiles];
    const profile = updated[index];
    
    // Obtener precios con IVA para el nuevo color
    const pricesWithIVA = getProfilePriceWithIVA(profile.name, color, profiles, materialIvaPercentage);

    updated[index] = {
      ...profile,
      color,
      price6m: pricesWithIVA.price6m,
      pricePerM: pricesWithIVA.pricePerM
    };
    
    onSelectedProfilesChange(updated);
    setShowColorMenu(null);
  };

  // Calculate total costs
  const totalCosts = selectedProfiles.reduce(
    (acc, profile) => {
      const amount = profile.chargingMethod === 'complete' 
        ? profile.price6m * profile.quantity
        : profile.pricePerM * profile.quantity;

      return {
        totalPieces: acc.totalPieces + (profile.chargingMethod === 'complete' ? amount : 0),
        totalMeters: acc.totalMeters + (profile.chargingMethod === 'meter' ? amount : 0)
      };
    },
    { totalPieces: 0, totalMeters: 0 }
  );

  // Display full profile name
  const displayName = (name: string) => {
    return name;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold text-[#003366] mb-2">PERFILES</h4>
          {pricesUpdated && (
            <div className="flex items-center gap-1 text-green-600 text-sm animate-pulse">
              <RefreshCw size={14} />
              <span>Precios actualizados</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setDefaultChargingMethod('complete')}
            className={`px-2 py-1 rounded-lg font-medium transition-colors text-xs md:text-sm ${
              defaultChargingMethod === 'complete'
                ? 'bg-[#003366] text-white'
                : 'bg-gray-100 text-[#003366] hover:bg-gray-200'
            }`}
          >
            Por pieza
          </button>
          <button
            onClick={() => setDefaultChargingMethod('meter')}
            className={`px-2 py-1 rounded-lg font-medium transition-colors text-xs md:text-sm ${
              defaultChargingMethod === 'meter'
                ? 'bg-[#003366] text-white'
                : 'bg-gray-100 text-[#003366] hover:bg-gray-200'
            }`}
          >
            Por metro
          </button>
        </div>
      </div>
      
      {/* Search input */}
      <div className="relative mb-4">
        <div className="flex items-center">
          <Search className="absolute left-3 text-gray-400" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchTerm.trim() !== '' && searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder="Buscar perfiles (jamba, riel, cerco, etc.)..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setShowResults(false);
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Search results */}
        {showResults && searchResults.length > 0 && (
          <div 
            ref={searchResultsRef}
            className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              {searchResults.map((profile, idx) => {
                const hasPrice = availableColors.some(color => {
                  const colorData = profile.colors[color];
                  return colorData && parseFloat(colorData.price6m) > 0;
                });
                
                return (
                  <div
                    key={`${profile.name}-${idx}`}
                    className={`flex items-center justify-between px-4 py-2 rounded ${
                      hasPrice ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{displayName(profile.name)}</span>
                    </div>
                    {hasPrice && (
                      <button
                        onClick={() => handleProfileSelect(profile)}
                        className="text-green-500 hover:text-green-600"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Selected profiles list */}
      {selectedProfiles.length > 0 ? (
        <div>
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
            <div>PERFIL</div>
            <div className="text-center">COLOR</div>
            <div className="text-center">CANTIDAD</div>
            <div className="text-right">MÉTODO</div>
            <div className="text-right">TOTAL</div>
            <div></div>
          </div>
        
          <div className="space-y-4 mt-2">
            {selectedProfiles.map((profile, index) => {
              const profileId = profile.id || `profile-${index}`;
              return (
                <div key={profileId} className="md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center py-2 bg-gray-50 rounded-lg p-3">
                  {/* Versión móvil */}
                  <div className="md:hidden">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{displayName(profile.name)}</div>
                      <button
                        onClick={() => handleRemoveProfile(index)}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <div className="text-xs text-gray-500">Color:</div>
                        <div className="relative">
                          <button
                            onClick={() => setShowColorMenu(showColorMenu === index ? null : index)}
                            className="px-2 py-1 border rounded text-sm w-full text-left flex items-center justify-between"
                          >
                            <span>{profile.color}</span>
                            {showColorMenu === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {showColorMenu === index && (
                            <div className="absolute left-0 z-30 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                              {availableColors.map((color) => {
                                const profileData = profiles.find(p => p.name === profile.name);
                                const colorData = profileData?.colors[color];
                                const hasPrice = colorData && parseFloat(colorData.price6m) > 0;

                                return (
                                  <button
                                    key={color}
                                    onClick={() => hasPrice && handleColorChange(index, color)}
                                    className={`w-full px-4 py-2 text-left flex justify-between items-center ${
                                      hasPrice ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>{color}</span>
                                    {profile.color === color && (
                                      <Check size={16} className="text-green-500" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-500">Cantidad:</div>
                        <div className="flex items-center">
                          <button
                            onClick={() => handleQuantityChange(index, profile.quantity - 1)}
                            className={`p-1 ${profile.quantity <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            disabled={profile.quantity <= 0}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={profile.quantity || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                              handleQuantityChange(index, value);
                            }}
                            className="mx-2 min-w-[40px] w-12 text-center border rounded"
                          />
                          <button
                            onClick={() => handleQuantityChange(index, profile.quantity + 1)}
                            className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Método:</div>
                        <select
                          value={profile.chargingMethod}
                          onChange={(e) => handleChargingMethodChange(index, e.target.value as 'complete' | 'meter')}
                          className="px-2 py-1 border rounded text-sm w-full"
                        >
                          <option value="complete">Por pieza</option>
                          <option value="meter">Por metro</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-500">Total:</div>
                        <div className="font-bold">
                          ${(profile.chargingMethod === 'complete' 
                              ? profile.price6m * profile.quantity 
                              : profile.pricePerM * profile.quantity
                            ).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${profile.chargingMethod === 'complete' 
                              ? profile.price6m.toFixed(2) + ' / pieza'
                              : profile.pricePerM.toFixed(2) + ' / metro'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Versión desktop */}
                  <div className="hidden md:block font-medium">{displayName(profile.name)}</div>
                  <div className="hidden md:block text-center relative">
                    <button
                      onClick={() => setShowColorMenu(showColorMenu === index ? null : index)}
                      className="px-2 py-1 border rounded text-sm w-full text-left flex items-center justify-between"
                    >
                      <span>{profile.color}</span>
                      {showColorMenu === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showColorMenu === index && (
                      <div className="absolute left-0 z-30 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                        {availableColors.map((color) => {
                          const profileData = profiles.find(p => p.name === profile.name);
                          const colorData = profileData?.colors[color];
                          const hasPrice = colorData && parseFloat(colorData.price6m) > 0;

                          return (
                            <button
                              key={color}
                              onClick={() => hasPrice && handleColorChange(index, color)}
                              className={`w-full px-4 py-2 text-left flex justify-between items-center ${
                                hasPrice ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <span>{color}</span>
                              {profile.color === color && (
                                <Check size={16} className="text-green-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleQuantityChange(index, profile.quantity - 1)}
                        className={`p-1 ${profile.quantity <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        disabled={profile.quantity <= 0}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={profile.quantity || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          handleQuantityChange(index, value);
                        }}
                        className="mx-2 min-w-[40px] w-12 text-center border rounded"
                      />
                      <button
                        onClick={() => handleQuantityChange(index, profile.quantity + 1)}
                        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block text-right">
                    <select
                      value={profile.chargingMethod}
                      onChange={(e) => handleChargingMethodChange(index, e.target.value as 'complete' | 'meter')}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="complete">Por pieza</option>
                      <option value="meter">Por metro</option>
                    </select>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="font-bold">
                      ${(profile.chargingMethod === 'complete' 
                          ? profile.price6m * profile.quantity 
                          : profile.pricePerM * profile.quantity
                        ).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${profile.chargingMethod === 'complete' 
                          ? profile.price6m.toFixed(2) + ' / pieza'
                          : profile.pricePerM.toFixed(2) + ' / metro'
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveProfile(index)}
                    className="hidden md:block p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        
          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg mt-4">
            <span className="font-medium">Total perfiles:</span>
            <div className="text-right">
              {totalCosts.totalPieces > 0 && (
                <div className="text-sm">Por pieza: ${totalCosts.totalPieces.toFixed(2)}</div>
              )}
              {totalCosts.totalMeters > 0 && (
                <div className="text-sm">Por metro: ${totalCosts.totalMeters.toFixed(2)}</div>
              )}
              <div className="font-bold mt-1">
                Total: ${(totalCosts.totalPieces + totalCosts.totalMeters).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay perfiles seleccionados</p>
          <p className="text-sm text-gray-400 mt-1">Busca y agrega perfiles desde la lista</p>
        </div>
      )}
    </div>
  );
}