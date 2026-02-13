import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Minus, RefreshCw } from 'lucide-react';
import { getGlassPriceWithIVA, getGlassBasePrices } from '../utils/priceCalculations';
import { useSyncedState } from '../hooks/useSyncedState';
import { usePriceDatabase } from '../hooks/usePriceDatabase';

interface Glass {
  name: string;
  pricePerPiece: string;
  pricePerM2: string;
}

interface SelectedGlass {
  name: string;
  quantity: number;
  price: number;
  total: number;
  chargingMethod: 'piece' | 'm2';
  pricePerPiece: number;
  pricePerM2: number;
  id?: string;
}

interface GlassSearchAndSelectionProps {
  glass: Glass[];
  selectedGlass: SelectedGlass[];
  onSelectedGlassChange: (glass: SelectedGlass[]) => void;
}

export function GlassSearchAndSelection({
  glass,
  selectedGlass,
  onSelectedGlassChange
}: GlassSearchAndSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Glass[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [defaultChargingMethod, setDefaultChargingMethod] = useState<'piece' | 'm2'>(() => {
    const savedMethod = localStorage.getItem('defaultGlassChargingMethod');
    return (savedMethod as 'piece' | 'm2') || 'piece';
  });
  const [pricesUpdated, setPricesUpdated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Estado para el porcentaje de IVA
  const [materialIvaPercentage] = useSyncedState<number>('materialIvaPercentage', 16);

  // Hook para detectar cambios en la base de datos de precios
  const { glass: latestGlass, lastUpdate } = usePriceDatabase();

  // Filter search results when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    const results = glass.filter(item => {
      return item.name.toLowerCase().includes(normalizedSearch);
    });

    setSearchResults(results);
    setShowResults(true);
  }, [searchTerm, glass]);

  // Save default charging method to localStorage
  useEffect(() => {
    localStorage.setItem('defaultGlassChargingMethod', defaultChargingMethod);
  }, [defaultChargingMethod]);

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

  // Actualizar precios cuando cambie la base de datos o el IVA
  useEffect(() => {
    if (selectedGlass.length === 0 || latestGlass.length === 0) return;

    let hasUpdates = false;
    const updatedGlass = selectedGlass.map(selectedItem => {
      // Buscar el vidrio en la base de datos actualizada
      const dbGlass = latestGlass.find(g => g.name === selectedItem.name);

      if (!dbGlass) {
        return selectedItem;
      }

      // Obtener precios actualizados con IVA
      const updatedPrices = getGlassPriceWithIVA(
        selectedItem.name,
        latestGlass,
        materialIvaPercentage
      );

      // Calcular nuevo precio basado en el método de cobro actual
      const newPrice = selectedItem.chargingMethod === 'piece'
        ? updatedPrices.pricePerPiece
        : updatedPrices.pricePerM2;

      const newTotal = newPrice * selectedItem.quantity;

      // Verificar si los precios cambiaron
      if (
        Math.abs(updatedPrices.pricePerPiece - selectedItem.pricePerPiece) > 0.01 ||
        Math.abs(updatedPrices.pricePerM2 - selectedItem.pricePerM2) > 0.01
      ) {
        hasUpdates = true;
        return {
          ...selectedItem,
          price: newPrice,
          total: newTotal,
          pricePerPiece: updatedPrices.pricePerPiece,
          pricePerM2: updatedPrices.pricePerM2
        };
      }

      return selectedItem;
    });

    if (hasUpdates) {
      onSelectedGlassChange(updatedGlass);
      setPricesUpdated(true);
      setTimeout(() => setPricesUpdated(false), 3000);
    }
  }, [lastUpdate, materialIvaPercentage, latestGlass]);

  const handleAddGlass = (item: Glass) => {
    // Obtener precios CON IVA para almacenar en selectedGlass
    const pricesWithIVA = getGlassPriceWithIVA(item.name, [item], materialIvaPercentage);

    // Determine default charging method based on available prices
    let defaultMethod: 'piece' | 'm2' = defaultChargingMethod;
    if (pricesWithIVA.pricePerPiece > 0 && pricesWithIVA.pricePerM2 === 0) {
      defaultMethod = 'piece';
    } else if (pricesWithIVA.pricePerM2 > 0 && pricesWithIVA.pricePerPiece === 0) {
      defaultMethod = 'm2';
    }

    // Usar precio CON IVA para el cálculo
    const price = defaultMethod === 'piece' ? pricesWithIVA.pricePerPiece : pricesWithIVA.pricePerM2;

    const newItem: SelectedGlass = {
      id: crypto.randomUUID(),
      name: item.name,
      quantity: 1,
      price,
      total: price,
      chargingMethod: defaultMethod,
      pricePerPiece: pricesWithIVA.pricePerPiece,
      pricePerM2: pricesWithIVA.pricePerM2
    };
    
    onSelectedGlassChange([...selectedGlass, newItem]);
    setSearchTerm('');
    setShowResults(false);
    
    // Keep focus on the search input after adding an item
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleRemoveGlass = (index: number) => {
    onSelectedGlassChange(selectedGlass.filter((_, i) => i !== index));
    // Mantener el foco en el campo de búsqueda después de eliminar
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleQuantityChange = (index: number, newQuantity: number) => {
    // Permitir valores de 0 o mayores
    if (newQuantity < 0) return;
    
    const updated = [...selectedGlass];
    updated[index].quantity = newQuantity;
    updated[index].total = newQuantity * updated[index].price;
    onSelectedGlassChange(updated);
  };
  
  const handleChargingMethodChange = (index: number, method: 'piece' | 'm2') => {
    const updated = [...selectedGlass];
    const item = updated[index];

    // Update charging method and unit price (ya incluye IVA)
    item.chargingMethod = method;
    item.price = method === 'piece' ? item.pricePerPiece : item.pricePerM2;

    // Recalculate total
    item.total = item.quantity * item.price;

    onSelectedGlassChange(updated);
  };

  // Calculate total cost of selected glass
  const totalCost = selectedGlass.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold text-[#003366] mb-2">VIDRIOS</h4>
          {pricesUpdated && (
            <div className="flex items-center gap-1 text-green-600 text-sm animate-pulse">
              <RefreshCw size={14} />
              <span>Precios actualizados</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setDefaultChargingMethod('piece')}
            className={`px-2 py-1 rounded-lg font-medium transition-colors text-xs md:text-sm ${
              defaultChargingMethod === 'piece'
                ? 'bg-[#003366] text-white'
                : 'bg-gray-100 text-[#003366] hover:bg-gray-200'
            }`}
          >
            Por pieza
          </button>
          <button
            onClick={() => setDefaultChargingMethod('m2')}
            className={`px-2 py-1 rounded-lg font-medium transition-colors text-xs md:text-sm ${
              defaultChargingMethod === 'm2'
                ? 'bg-[#003366] text-white'
                : 'bg-gray-100 text-[#003366] hover:bg-gray-200'
            }`}
          >
            Por m²
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
            placeholder="Buscar vidrios (claro, filtrasol, reflecta, etc.)..."
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
              {searchResults.map((item) => {
                const hasPrice = parseFloat(item.pricePerPiece) > 0 || parseFloat(item.pricePerM2) > 0;
                
                // Obtener precios con IVA para mostrar
                const pricesWithIVA = hasPrice ? getGlassPriceWithIVA(item.name, [item], materialIvaPercentage) : { pricePerPiece: 0, pricePerM2: 0 };
                
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between px-4 py-2 rounded ${
                      hasPrice ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {hasPrice && (
                        <div className="text-sm text-gray-500">
                          {pricesWithIVA.pricePerPiece > 0 && `$${pricesWithIVA.pricePerPiece.toFixed(2)}/pieza`}
                          {pricesWithIVA.pricePerPiece > 0 && pricesWithIVA.pricePerM2 > 0 && ' - '}
                          {pricesWithIVA.pricePerM2 > 0 && `$${pricesWithIVA.pricePerM2.toFixed(2)}/m²`}
                        </div>
                      )}
                    </div>
                    {hasPrice && (
                      <button
                        onClick={() => handleAddGlass(item)}
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
      
      {/* Selected glass list */}
      {selectedGlass.length > 0 ? (
        <div className="space-y-4">
          {selectedGlass.map((item, index) => {
            const itemId = item.id || `glass-${index}`;
            return (
              <div key={itemId} className="p-3 bg-green-50 rounded-lg">
                {/* Versión móvil */}
                <div className="md:hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{item.name}</div>
                    <button
                      onClick={() => handleRemoveGlass(index)}
                      className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-xs text-gray-500">Cantidad:</div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          className={`p-1 ${item.quantity <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          disabled={item.quantity <= 0}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            handleQuantityChange(index, value);
                          }}
                          className="mx-2 min-w-[40px] w-12 text-center border rounded"
                        />
                        <button
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500">Método:</div>
                      <select
                        value={item.chargingMethod}
                        onChange={(e) => handleChargingMethodChange(index, e.target.value as 'piece' | 'm2')}
                        className="px-2 py-1 border rounded text-sm w-full"
                        disabled={item.pricePerPiece === 0 || item.pricePerM2 === 0}
                      >
                        <option value="piece" disabled={item.pricePerPiece === 0}>Por pieza</option>
                        <option value="m2" disabled={item.pricePerM2 === 0}>Por m²</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total:</div>
                    <div className="font-bold">${item.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      ${item.price.toFixed(2)}/{item.chargingMethod === 'piece' ? 'pieza' : 'm²'}
                    </div>
                  </div>
                </div>
                
                {/* Versión desktop */}
                <div className="hidden md:flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center mt-1">
                      <button
                        onClick={() => handleQuantityChange(index, item.quantity - 1)}
                        className={`p-1 ${item.quantity <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        disabled={item.quantity <= 0}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleQuantityChange(index, value);
                        }}
                        className="mx-2 min-w-[40px] w-12 text-center border rounded"
                      />
                      <button
                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mx-2">
                    <select
                      value={item.chargingMethod}
                      onChange={(e) => handleChargingMethodChange(index, e.target.value as 'piece' | 'm2')}
                      className="px-2 py-1 border rounded text-sm"
                      disabled={item.pricePerPiece === 0 || item.pricePerM2 === 0}
                    >
                      <option value="piece" disabled={item.pricePerPiece === 0}>Por pieza</option>
                      <option value="m2" disabled={item.pricePerM2 === 0}>Por m²</option>
                    </select>
                  </div>
                  <div className="text-right mr-2">
                    <p className="font-bold">${item.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      ${item.price.toFixed(2)}/{item.chargingMethod === 'piece' ? 'pieza' : 'm²'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveGlass(index)}
                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg mt-2">
            <span className="font-medium">Total vidrios:</span>
            <span className="font-bold">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay vidrios seleccionados</p>
          <p className="text-sm text-gray-400 mt-1">Busca y agrega vidrios desde la lista</p>
        </div>
      )}
    </div>
  );
}