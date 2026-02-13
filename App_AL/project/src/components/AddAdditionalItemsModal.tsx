import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Search } from 'lucide-react';
import { getHardwarePriceWithIVA, calculateHardwareCostWithIVA, getGlassPriceWithIVA, getGlassBasePrices } from '../utils/priceCalculations';
import { useSyncedState } from '../hooks/useSyncedState';
import { usePriceUpdates } from '../hooks/usePriceUpdates';

interface Hardware {
  name: string;
  pricePerPackage: string;
  pricePerPiece: string;
}

interface Glass {
  name: string;
  pricePerPiece: string;
  pricePerM2: string;
}

interface Profile {
  name: string;
  colors: {
    [key: string]: {
      price6m: string;
      pricePerM: string;
    };
  };
}

export interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  chargingMethod: 'package' | 'piece' | 'm2' | 'per6m' | 'perMeter';
  basePricePerPackage: number;
  basePricePerPiece: number;
  basePricePerM2?: number;
  basePricePer6m?: number;
  basePricePerMeter?: number;
  selectedColor?: string;
  category: 'tornillos' | 'felpas' | 'viniles' | 'herrajes' | 'vidrios' | 'perfiles';
  type: 'hardware' | 'glass' | 'profile';
}

interface AddAdditionalItemsModalProps {
  onClose: () => void;
  onSaveAdditionalItems: (items: SelectedItem[]) => void;
}

type AllItemType =
  | (Hardware & { category: 'tornillos' | 'felpas' | 'viniles' | 'herrajes'; type: 'hardware' })
  | (Glass & { category: 'vidrios'; type: 'glass' })
  | (Profile & { category: 'perfiles'; type: 'profile' });

export function AddAdditionalItemsModal({ onClose, onSaveAdditionalItems }: AddAdditionalItemsModalProps) {
  const [allItems, setAllItems] = useState<AllItemType[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [localQuantitiesInput, setLocalQuantitiesInput] = useState<{ [key: string]: string }>({});
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AllItemType[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // Estado para el porcentaje de IVA
  const [materialIvaPercentage] = useSyncedState<number>('materialIvaPercentage', 16);

  const { priceData } = usePriceUpdates();

  useEffect(() => {
    if (priceData && priceData.timestamp) {
      console.log('🔔 Detectados cambios de precio en AddAdditionalItemsModal, actualizando precios base...');

      const updatedSelectedItems = selectedItems.map(item => {
        const hardwareInDB = priceData.hardware.find((h: any) => h.name === item.name);

        if (hardwareInDB && item.type === 'hardware') {
          const newBasePricePerPackage = parseFloat(hardwareInDB.pricePerPackage) || 0;
          const newBasePricePerPiece = parseFloat(hardwareInDB.pricePerPiece) || 0;

          if (
            newBasePricePerPackage !== item.basePricePerPackage ||
            newBasePricePerPiece !== item.basePricePerPiece
          ) {
            console.log(`💰 Actualizando precio de "${item.name}" en el modal`);
            return {
              ...item,
              basePricePerPackage: newBasePricePerPackage,
              basePricePerPiece: newBasePricePerPiece
            };
          }
        }

        const glassInDB = priceData.glass.find((g: any) => g.name === item.name);
        if (glassInDB && item.type === 'glass') {
          const newBasePricePerPiece = parseFloat(glassInDB.pricePerPiece) || 0;
          const newBasePricePerM2 = parseFloat(glassInDB.pricePerM2) || 0;

          if (
            newBasePricePerPiece !== item.basePricePerPiece ||
            (item.basePricePerM2 && newBasePricePerM2 !== item.basePricePerM2)
          ) {
            console.log(`💰 Actualizando precio de vidrio "${item.name}" en el modal`);
            return {
              ...item,
              basePricePerPiece: newBasePricePerPiece,
              basePricePerM2: newBasePricePerM2
            };
          }
        }

        return item;
      });

      const hasChanges = updatedSelectedItems.some((item, index) =>
        item.basePricePerPackage !== selectedItems[index].basePricePerPackage ||
        item.basePricePerPiece !== selectedItems[index].basePricePerPiece ||
        (item.basePricePerM2 && item.basePricePerM2 !== selectedItems[index].basePricePerM2)
      );

      if (hasChanges) {
        setSelectedItems(updatedSelectedItems);
        console.log('✅ Precios actualizados en elementos seleccionados del modal');
      }
    }
  }, [priceData.timestamp]);

  // Initialize local quantities input when selectedItems changes
  useEffect(() => {
    const newLocalQuantities: { [key: string]: string } = {};
    selectedItems.forEach(item => {
      // Always set based on current quantity - empty string if 0, otherwise the number
      newLocalQuantities[item.id] = item.quantity === 0 ? '' : item.quantity.toString();
    });
    setLocalQuantitiesInput(newLocalQuantities);
  }, [selectedItems]);

  // Load and categorize all hardware, glass, and profile items
  useEffect(() => {
    const loadAllItems = () => {
      const allCombinedItems: AllItemType[] = [];

      // Load hardware items
      const savedHardware = localStorage.getItem('windowHardware');
      if (savedHardware) {
        try {
          const parsedHardware = JSON.parse(savedHardware);

          const categorizedHardware = parsedHardware.map((item: Hardware) => {
            let category: 'tornillos' | 'felpas' | 'viniles' | 'herrajes';

            if (item.name.includes('TORNILLO') || item.name.includes('PIJA')) {
              category = 'tornillos';
            } else if (item.name.includes('FELPA')) {
              category = 'felpas';
            } else if (item.name.toLowerCase().includes('vinil')) {
              category = 'viniles';
            } else {
              category = 'herrajes';
            }

            return { ...item, category, type: 'hardware' as const };
          });

          allCombinedItems.push(...categorizedHardware);
        } catch (error) {
          console.error('Error loading hardware:', error);
        }
      }

      // Load glass items
      const savedGlass = localStorage.getItem('windowGlass');
      if (savedGlass) {
        try {
          const parsedGlass = JSON.parse(savedGlass);

          const categorizedGlass = parsedGlass.map((item: Glass) => ({
            ...item,
            category: 'vidrios' as const,
            type: 'glass' as const
          }));

          allCombinedItems.push(...categorizedGlass);
        } catch (error) {
          console.error('Error loading glass:', error);
        }
      }

      // Load profile items
      const savedProfiles = localStorage.getItem('windowProfiles');
      if (savedProfiles) {
        try {
          const parsedProfiles = JSON.parse(savedProfiles);

          const categorizedProfiles = parsedProfiles.map((item: Profile) => ({
            ...item,
            category: 'perfiles' as const,
            type: 'profile' as const
          }));

          allCombinedItems.push(...categorizedProfiles);
        } catch (error) {
          console.error('Error loading profiles:', error);
        }
      }

      setAllItems(allCombinedItems);
    };

    loadAllItems();
  }, []);

  // Filter search results when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    const results = allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(normalizedSearch);
      return matchesSearch;
    });

    setSearchResults(results);
    setShowResults(true);
  }, [searchTerm, allItems]);

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

  const handleAddItem = (item: AllItemType) => {
    let newItem: SelectedItem;

    if (item.type === 'hardware') {
      // Handle hardware items
      const pricesWithIVA = getHardwarePriceWithIVA(item.name, [item], materialIvaPercentage);

      // Determine default charging method based on available prices
      let defaultChargingMethod: 'package' | 'piece' = 'piece';
      if (pricesWithIVA.basePricePerPackage > 0 && pricesWithIVA.basePricePerPiece === 0) {
        defaultChargingMethod = 'package';
      } else if (pricesWithIVA.basePricePerPackage > 0) {
        // If both prices are available, prefer package
        defaultChargingMethod = 'package';
      }

      newItem = {
        id: crypto.randomUUID(),
        name: item.name,
        quantity: 0,
        chargingMethod: defaultChargingMethod,
        basePricePerPackage: pricesWithIVA.basePricePerPackage,
        basePricePerPiece: pricesWithIVA.basePricePerPiece,
        category: item.category,
        type: 'hardware'
      };
    } else if (item.type === 'glass') {
      // Handle glass items - usar precios BASE (sin IVA)
      const basePrices = getGlassBasePrices(item.name, [item as Glass]);

      // Determine default charging method based on available prices
      let defaultChargingMethod: 'piece' | 'm2' = 'piece';
      if (basePrices.pricePerPiece > 0 && basePrices.pricePerM2 === 0) {
        defaultChargingMethod = 'piece';
      } else if (basePrices.pricePerM2 > 0 && basePrices.pricePerPiece === 0) {
        defaultChargingMethod = 'm2';
      } else if (basePrices.pricePerM2 > 0) {
        // If both prices are available, prefer m2
        defaultChargingMethod = 'm2';
      }

      newItem = {
        id: crypto.randomUUID(),
        name: item.name,
        quantity: 0,
        chargingMethod: defaultChargingMethod,
        basePricePerPackage: 0,
        basePricePerPiece: basePrices.pricePerPiece,
        basePricePerM2: basePrices.pricePerM2,
        category: 'vidrios',
        type: 'glass'
      };
    } else {
      // Handle profile items
      const profileItem = item as Profile & { category: 'perfiles'; type: 'profile' };

      // Get the first available color with prices
      const colors = Object.keys(profileItem.colors);
      let defaultColor = colors[0];
      let defaultPrice6m = 0;
      let defaultPricePerM = 0;

      // Find first color with valid prices
      for (const color of colors) {
        const price6m = parseFloat(profileItem.colors[color].price6m) || 0;
        const pricePerM = parseFloat(profileItem.colors[color].pricePerM) || 0;
        if (price6m > 0 || pricePerM > 0) {
          defaultColor = color;
          defaultPrice6m = price6m;
          defaultPricePerM = pricePerM;
          break;
        }
      }

      // Determine default charging method based on available prices
      let defaultChargingMethod: 'per6m' | 'perMeter' = 'per6m';
      if (defaultPrice6m > 0 && defaultPricePerM === 0) {
        defaultChargingMethod = 'per6m';
      } else if (defaultPricePerM > 0 && defaultPrice6m === 0) {
        defaultChargingMethod = 'perMeter';
      } else if (defaultPrice6m > 0) {
        // If both prices are available, prefer per6m
        defaultChargingMethod = 'per6m';
      }

      newItem = {
        id: crypto.randomUUID(),
        name: item.name,
        quantity: 0,
        chargingMethod: defaultChargingMethod,
        basePricePerPackage: 0,
        basePricePerPiece: 0,
        basePricePer6m: defaultPrice6m,
        basePricePerMeter: defaultPricePerM,
        selectedColor: defaultColor,
        category: 'perfiles',
        type: 'profile'
      };
    }
    
    // Check if item already exists
    const existingIndex = selectedItems.findIndex(i => i.name === item.name);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1; // Keep this as 1 for existing items
      setSelectedItems(updated);
      // Update local input for existing item
      setLocalQuantitiesInput(prev => ({
        ...prev,
        [updated[existingIndex].id]: updated[existingIndex].quantity.toString()
      }));
    } else {
      setSelectedItems([...selectedItems, newItem]);
      // Set local input to empty for new items (quantity is 0)
      setLocalQuantitiesInput(prev => ({
        ...prev,
        [newItem.id]: ''
      }));
    }
    
    setSearchTerm('');
    setShowResults(false);
    
    // Keep focus on the search input after adding an item
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
    // Mantener el foco en el campo de búsqueda después de eliminar
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    const updated = selectedItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQuantity
        };
      }
      return item;
    });
    
    setSelectedItems(updated);
    
    // Update local input to reflect the new quantity (empty if 0)
    setLocalQuantitiesInput(prev => ({
      ...prev,
      [id]: newQuantity === 0 ? '' : newQuantity.toString()
    }));
  };

  const handleQuantityInputChange = (id: string, value: string) => {
    setLocalQuantitiesInput(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Update quantity in real-time for immediate price calculation
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      handleQuantityChange(id, parsedValue);
    } else if (value === '') {
      // If input is empty, set quantity to 0
      handleQuantityChange(id, 0);
    }
  };

  const handleQuantityInputBlur = (id: string, value: string) => {
    // Only handle cleanup on blur - the real calculation is already done in onChange
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      // If invalid, reset to 0 and clear input
      handleQuantityChange(id, 0);
      setLocalQuantitiesInput(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const handleChargingMethodChange = (id: string, method: 'package' | 'piece' | 'm2' | 'per6m' | 'perMeter') => {
    const updated = selectedItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          chargingMethod: method
        };
      }
      return item;
    });

    setSelectedItems(updated);
  };

  const handleColorChange = (id: string, newColor: string) => {
    const item = selectedItems.find(i => i.id === id);
    if (!item || item.type !== 'profile') return;

    // Find the profile in allItems to get the prices for the new color
    const profile = allItems.find(p => p.name === item.name && p.type === 'profile') as (Profile & { category: 'perfiles'; type: 'profile' }) | undefined;
    if (!profile) return;

    const colorData = profile.colors[newColor];
    if (!colorData) return;

    const newPrice6m = parseFloat(colorData.price6m) || 0;
    const newPricePerM = parseFloat(colorData.pricePerM) || 0;

    // Update the item with new color and prices
    const updated = selectedItems.map(i => {
      if (i.id === id) {
        // Update charging method if current method doesn't have a price in new color
        let newChargingMethod = i.chargingMethod;
        if (i.chargingMethod === 'per6m' && newPrice6m === 0 && newPricePerM > 0) {
          newChargingMethod = 'perMeter';
        } else if (i.chargingMethod === 'perMeter' && newPricePerM === 0 && newPrice6m > 0) {
          newChargingMethod = 'per6m';
        }

        return {
          ...i,
          selectedColor: newColor,
          basePricePer6m: newPrice6m,
          basePricePerMeter: newPricePerM,
          chargingMethod: newChargingMethod
        };
      }
      return i;
    });

    setSelectedItems(updated);
  };

  const handleSave = () => {
    onSaveAdditionalItems(selectedItems);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tornillos': return '🔩';
      case 'felpas': return '📏';
      case 'viniles': return '🎨';
      case 'herrajes': return '⚙️';
      case 'vidrios': return '🪟';
      case 'perfiles': return '📐';
      default: return '📦';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'tornillos': return 'Tornillo';
      case 'felpas': return 'Felpa';
      case 'viniles': return 'Vinil';
      case 'herrajes': return 'Herraje';
      case 'vidrios': return 'Vidrio';
      case 'perfiles': return 'Perfil';
      default: return 'Elemento';
    }
  };

  // Calculate total cost
  const totalCost = selectedItems.reduce((sum, item) => {
    if (item.type === 'hardware') {
      const { total } = calculateHardwareCostWithIVA(
        item.basePricePerPackage,
        item.basePricePerPiece,
        item.quantity,
        item.chargingMethod as 'package' | 'piece',
        materialIvaPercentage
      );
      return sum + total;
    } else if (item.type === 'glass') {
      // Glass calculation
      const basePrice = item.chargingMethod === 'piece' ? item.basePricePerPiece : (item.basePricePerM2 || 0);
      const ivaDecimal = materialIvaPercentage / 100;
      const priceWithIVA = basePrice * (1 + ivaDecimal);
      const total = priceWithIVA * item.quantity;
      return sum + total;
    } else {
      // Profile calculation
      const basePrice = item.chargingMethod === 'per6m' ? (item.basePricePer6m || 0) : (item.basePricePerMeter || 0);
      const ivaDecimal = materialIvaPercentage / 100;
      const priceWithIVA = basePrice * (1 + ivaDecimal);
      const total = priceWithIVA * item.quantity;
      return sum + total;
    }
  }, 0);

  // Items to display based on filter
  const itemsToDisplay = showOnlySelected 
    ? allItems.filter(item => selectedItems.some(selected => selected.name === item.name))
    : (showResults ? searchResults : []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#003366]">Elementos Adicionales</h2>
              <p className="text-sm text-gray-600 mt-1">Los precios mostrados incluyen {materialIvaPercentage}% de IVA de materiales</p>
            </div>
            <button
              onClick={() => {
                if (selectedItems.length > 0) {
                  if (confirm('¿Estás seguro que deseas cerrar sin guardar los elementos seleccionados?')) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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
                placeholder="Buscar elementos (tornillos, felpas, herrajes, viniles, vidrios, perfiles, etc.)..."
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                style={{ width: 'calc(100% - 48px)' }}
              >
                <div className="p-2">
                  {searchResults.map((item, index) => {
                    let hasPrice = false;
                    if (item.type === 'hardware') {
                      hasPrice = parseFloat((item as Hardware).pricePerPackage) > 0 || parseFloat((item as Hardware).pricePerPiece) > 0;
                    } else if (item.type === 'glass') {
                      hasPrice = parseFloat((item as Glass).pricePerPiece) > 0 || parseFloat((item as Glass).pricePerM2) > 0;
                    } else if (item.type === 'profile') {
                      const profileItem = item as Profile & { category: 'perfiles'; type: 'profile' };
                      hasPrice = Object.values(profileItem.colors).some(color =>
                        parseFloat(color.price6m) > 0 || parseFloat(color.pricePerM) > 0
                      );
                    }

                    const isSelected = selectedItems.some(selected => selected.name === item.name);

                    // Obtener precios con IVA para mostrar según el tipo
                    let priceDisplay = '';
                    if (hasPrice) {
                      if (item.type === 'hardware') {
                        const pricesWithIVA = getHardwarePriceWithIVA(item.name, [item], materialIvaPercentage);
                        if (pricesWithIVA.pricePerPackage > 0) priceDisplay += `$${pricesWithIVA.pricePerPackage.toFixed(2)}/paquete`;
                        if (pricesWithIVA.pricePerPackage > 0 && pricesWithIVA.pricePerPiece > 0) priceDisplay += ' - ';
                        if (pricesWithIVA.pricePerPiece > 0) priceDisplay += `$${pricesWithIVA.pricePerPiece.toFixed(2)}/pieza`;
                      } else if (item.type === 'glass') {
                        const pricesWithIVA = getGlassPriceWithIVA(item.name, [item as Glass], materialIvaPercentage);
                        if (pricesWithIVA.pricePerPiece > 0) priceDisplay += `$${pricesWithIVA.pricePerPiece.toFixed(2)}/pieza`;
                        if (pricesWithIVA.pricePerPiece > 0 && pricesWithIVA.pricePerM2 > 0) priceDisplay += ' - ';
                        if (pricesWithIVA.pricePerM2 > 0) priceDisplay += `$${pricesWithIVA.pricePerM2.toFixed(2)}/m²`;
                      } else if (item.type === 'profile') {
                        const profileItem = item as Profile & { category: 'perfiles'; type: 'profile' };
                        const colors = Object.keys(profileItem.colors);
                        const colorCount = colors.length;
                        priceDisplay = `${colorCount} color${colorCount !== 1 ? 'es' : ''} disponible${colorCount !== 1 ? 's' : ''}`;
                      }
                    }
                    
                    return (
                      <div
                        key={`${item.name}-${index}`}
                        className={`flex items-center justify-between px-4 py-2 rounded ${
                          hasPrice ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(item.category)}</span>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <div className="text-xs text-gray-500">
                                {getCategoryName(item.category)}
                                {hasPrice && ` - ${priceDisplay}`}
                              </div>
                            </div>
                          </div>
                        </div>
                        {hasPrice && !isSelected && (
                          <button
                            onClick={() => handleAddItem(item)}
                            className="text-green-500 hover:text-green-600 p-1"
                          >
                            <Plus size={20} />
                          </button>
                        )}
                        {isSelected && (
                          <span className="text-blue-600 text-sm font-medium">Agregado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Filter toggle */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={() => setShowOnlySelected(!showOnlySelected)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Mostrar solo elementos seleccionados</span>
            </label>
          </div>

          {/* Selected items list */}
          <div className="max-h-96 overflow-y-auto mb-6">
            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-4">
                  <Search size={64} className="text-gray-400 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay elementos seleccionados</h3>
                <p>Busca y agrega elementos desde la lista de arriba</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#003366] mb-4">
                  Elementos Seleccionados ({selectedItems.length})
                </h3>
                {selectedItems.map((item) => (
                  <div key={item.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    {/* Versión móvil */}
                    <div className="md:hidden">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(item.category)}</span>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{getCategoryName(item.category)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      {item.type === 'profile' && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500">Color:</div>
                          <select
                            value={item.selectedColor || ''}
                            onChange={(e) => handleColorChange(item.id, e.target.value)}
                            className="px-2 py-1 border rounded text-sm w-full"
                          >
                            {(() => {
                              const profile = allItems.find(p => p.name === item.name && p.type === 'profile') as (Profile & { category: 'perfiles'; type: 'profile' }) | undefined;
                              if (!profile) return null;
                              return Object.keys(profile.colors).map(color => (
                                <option key={color} value={color}>{color}</option>
                              ));
                            })()}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <div className="text-xs text-gray-500">Cantidad:</div>
                          <div className="flex items-center">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className={`p-1 ${item.quantity <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                              disabled={item.quantity <= 0}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={localQuantitiesInput[item.id] || ''}
                              onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                              onBlur={(e) => handleQuantityInputBlur(item.id, e.target.value)}
                              className="mx-2 min-w-[40px] w-12 text-center border rounded"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
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
                            onChange={(e) => handleChargingMethodChange(item.id, e.target.value as any)}
                            className="px-2 py-1 border rounded text-sm w-full"
                            disabled={
                              item.type === 'hardware'
                                ? (item.basePricePerPackage === 0 || item.basePricePerPiece === 0)
                                : item.type === 'glass'
                                  ? (item.basePricePerPiece === 0 || (item.basePricePerM2 || 0) === 0)
                                  : ((item.basePricePer6m || 0) === 0 || (item.basePricePerMeter || 0) === 0)
                            }
                          >
                            {item.type === 'hardware' ? (
                              <>
                                <option value="package" disabled={item.basePricePerPackage === 0}>Por paquete</option>
                                <option value="piece" disabled={item.basePricePerPiece === 0}>Por pieza</option>
                              </>
                            ) : item.type === 'glass' ? (
                              <>
                                <option value="piece" disabled={item.basePricePerPiece === 0}>Por pieza</option>
                                <option value="m2" disabled={(item.basePricePerM2 || 0) === 0}>Por m²</option>
                              </>
                            ) : (
                              <>
                                <option value="per6m" disabled={(item.basePricePer6m || 0) === 0}>Por 6m</option>
                                <option value="perMeter" disabled={(item.basePricePerMeter || 0) === 0}>Por metro</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total (con IVA):</div>
                        <div className="font-bold">${(() => {
                          if (item.type === 'hardware') {
                            const { total } = calculateHardwareCostWithIVA(
                              item.basePricePerPackage,
                              item.basePricePerPiece,
                              item.quantity,
                              item.chargingMethod as 'package' | 'piece',
                              materialIvaPercentage
                            );
                            return total.toFixed(2);
                          } else if (item.type === 'glass') {
                            const basePrice = item.chargingMethod === 'piece' ? item.basePricePerPiece : (item.basePricePerM2 || 0);
                            const ivaDecimal = materialIvaPercentage / 100;
                            const priceWithIVA = basePrice * (1 + ivaDecimal);
                            const total = priceWithIVA * item.quantity;
                            return total.toFixed(2);
                          } else {
                            const basePrice = item.chargingMethod === 'per6m' ? (item.basePricePer6m || 0) : (item.basePricePerMeter || 0);
                            const ivaDecimal = materialIvaPercentage / 100;
                            const priceWithIVA = basePrice * (1 + ivaDecimal);
                            const total = priceWithIVA * item.quantity;
                            return total.toFixed(2);
                          }
                        })()}</div>
                        <div className="text-xs text-gray-500">
                          ${(() => {
                            if (item.type === 'hardware') {
                              const { price } = calculateHardwareCostWithIVA(
                                item.basePricePerPackage,
                                item.basePricePerPiece,
                                item.quantity,
                                item.chargingMethod as 'package' | 'piece',
                                materialIvaPercentage
                              );
                              return price.toFixed(2);
                            } else if (item.type === 'glass') {
                              const basePrice = item.chargingMethod === 'piece' ? item.basePricePerPiece : (item.basePricePerM2 || 0);
                              const ivaDecimal = materialIvaPercentage / 100;
                              const priceWithIVA = basePrice * (1 + ivaDecimal);
                              return priceWithIVA.toFixed(2);
                            } else {
                              const basePrice = item.chargingMethod === 'per6m' ? (item.basePricePer6m || 0) : (item.basePricePerMeter || 0);
                              const ivaDecimal = materialIvaPercentage / 100;
                              const priceWithIVA = basePrice * (1 + ivaDecimal);
                              return priceWithIVA.toFixed(2);
                            }
                          })()}/{
                            item.chargingMethod === 'package' ? 'paquete' :
                            item.chargingMethod === 'piece' ? 'pieza' :
                            item.chargingMethod === 'm2' ? 'm²' :
                            item.chargingMethod === 'per6m' ? '6m' : 'metro'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Versión desktop */}
                    <div className="hidden md:flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{getCategoryName(item.category)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {item.type === 'profile' && (
                          <select
                            value={item.selectedColor || ''}
                            onChange={(e) => handleColorChange(item.id, e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            {(() => {
                              const profile = allItems.find(p => p.name === item.name && p.type === 'profile') as (Profile & { category: 'perfiles'; type: 'profile' }) | undefined;
                              if (!profile) return null;
                              return Object.keys(profile.colors).map(color => (
                                <option key={color} value={color}>{color}</option>
                              ));
                            })()}
                          </select>
                        )}

                        <div className="flex items-center">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className={`p-1 ${item.quantity <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            disabled={item.quantity <= 0}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={localQuantitiesInput[item.id] || ''}
                            onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                            onBlur={(e) => handleQuantityInputBlur(item.id, e.target.value)}
                            className="mx-2 min-w-[40px] w-12 text-center border rounded"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <select
                          value={item.chargingMethod}
                          onChange={(e) => handleChargingMethodChange(item.id, e.target.value as any)}
                          className="px-2 py-1 border rounded text-sm"
                          disabled={
                            item.type === 'hardware'
                              ? (item.basePricePerPackage === 0 || item.basePricePerPiece === 0)
                              : item.type === 'glass'
                                ? (item.basePricePerPiece === 0 || (item.basePricePerM2 || 0) === 0)
                                : ((item.basePricePer6m || 0) === 0 || (item.basePricePerMeter || 0) === 0)
                          }
                        >
                          {item.type === 'hardware' ? (
                            <>
                              <option value="package" disabled={item.basePricePerPackage === 0}>Por paquete</option>
                              <option value="piece" disabled={item.basePricePerPiece === 0}>Por pieza</option>
                            </>
                          ) : item.type === 'glass' ? (
                            <>
                              <option value="piece" disabled={item.basePricePerPiece === 0}>Por pieza</option>
                              <option value="m2" disabled={(item.basePricePerM2 || 0) === 0}>Por m²</option>
                            </>
                          ) : (
                            <>
                              <option value="per6m" disabled={(item.basePricePer6m || 0) === 0}>Por 6m</option>
                              <option value="perMeter" disabled={(item.basePricePerMeter || 0) === 0}>Por metro</option>
                            </>
                          )}
                        </select>

                        <div className="text-right min-w-[80px]">
                          <p className="font-bold">${(() => {
                            if (item.type === 'hardware') {
                              const { total } = calculateHardwareCostWithIVA(
                                item.basePricePerPackage,
                                item.basePricePerPiece,
                                item.quantity,
                                item.chargingMethod as 'package' | 'piece',
                                materialIvaPercentage
                              );
                              return total.toFixed(2);
                            } else if (item.type === 'glass') {
                              const basePrice = item.chargingMethod === 'piece' ? item.basePricePerPiece : (item.basePricePerM2 || 0);
                              const ivaDecimal = materialIvaPercentage / 100;
                              const priceWithIVA = basePrice * (1 + ivaDecimal);
                              const total = priceWithIVA * item.quantity;
                              return total.toFixed(2);
                            } else {
                              const basePrice = item.chargingMethod === 'per6m' ? (item.basePricePer6m || 0) : (item.basePricePerMeter || 0);
                              const ivaDecimal = materialIvaPercentage / 100;
                              const priceWithIVA = basePrice * (1 + ivaDecimal);
                              const total = priceWithIVA * item.quantity;
                              return total.toFixed(2);
                            }
                          })()}</p>
                          <p className="text-xs text-gray-500">
                            ${(() => {
                              if (item.type === 'hardware') {
                                const { price } = calculateHardwareCostWithIVA(
                                  item.basePricePerPackage,
                                  item.basePricePerPiece,
                                  item.quantity,
                                  item.chargingMethod as 'package' | 'piece',
                                  materialIvaPercentage
                                );
                                return price.toFixed(2);
                              } else if (item.type === 'glass') {
                                const basePrice = item.chargingMethod === 'piece' ? item.basePricePerPiece : (item.basePricePerM2 || 0);
                                const ivaDecimal = materialIvaPercentage / 100;
                                const priceWithIVA = basePrice * (1 + ivaDecimal);
                                return priceWithIVA.toFixed(2);
                              } else {
                                const basePrice = item.chargingMethod === 'per6m' ? (item.basePricePer6m || 0) : (item.basePricePerMeter || 0);
                                const ivaDecimal = materialIvaPercentage / 100;
                                const priceWithIVA = basePrice * (1 + ivaDecimal);
                                return priceWithIVA.toFixed(2);
                              }
                            })()}/{
                              item.chargingMethod === 'package' ? 'paq' :
                              item.chargingMethod === 'piece' ? 'pz' :
                              item.chargingMethod === 'm2' ? 'm²' :
                              item.chargingMethod === 'per6m' ? '6m' : 'm'
                            }
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total and action buttons */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4">
              <span className="font-bold text-lg">Total (con {materialIvaPercentage}% IVA de materiales):</span>
              <span className="font-bold text-lg text-[#003366]">${totalCost.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors"
                disabled={selectedItems.length === 0}
              >
                Guardar ({selectedItems.length} elemento{selectedItems.length !== 1 ? 's' : ''})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}