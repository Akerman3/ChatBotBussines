import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Minus, RefreshCw } from 'lucide-react';
import { getHardwarePriceWithIVA } from '../utils/priceCalculations';
import { useSyncedState } from '../hooks/useSyncedState';
import { usePriceDatabase } from '../hooks/usePriceDatabase';

interface Hardware {
  name: string;
  pricePerPackage: string;
  pricePerPiece: string;
}

interface SelectedHardware {
  name: string;
  quantity: number;
  price: number;
  total: number;
  chargingMethod: 'package' | 'piece';
  pricePerPackage: number;
  pricePerPiece: number;
  id?: string;
}

interface HardwareSearchAndSelectionProps {
  hardware: Hardware[];
  selectedHardware: SelectedHardware[];
  onSelectedHardwareChange: (hardware: SelectedHardware[]) => void;
  lineType?: 'L2' | 'L3' | 'all';
}

export function HardwareSearchAndSelection({
  hardware,
  selectedHardware,
  onSelectedHardwareChange,
  lineType = 'L3'
}: HardwareSearchAndSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Hardware[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [pricesUpdated, setPricesUpdated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Estado para el porcentaje de IVA
  const [materialIvaPercentage] = useSyncedState<number>('materialIvaPercentage', 16);

  // Hook para detectar cambios en la base de datos de precios
  const { hardware: latestHardware, lastUpdate } = usePriceDatabase();

  // Filter hardware by line type
  const filteredHardware = hardware.filter(item => {
    if (lineType === 'all') {
      return true; // Show all hardware items
    } else if (lineType === 'L2') {
      return item.name.includes('_L2') || (!item.name.includes('_L2') && !item.name.includes('_L3'));
    } else {
      return item.name.includes('_L3') || (!item.name.includes('_L2') && !item.name.includes('_L3'));
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
    // IMPORTANTE: Permitimos agregar el mismo herraje múltiples veces
    // NO filtramos los herrajes que ya están seleccionados
    const results = filteredHardware.filter(item => {      
      return item.name.toLowerCase().includes(normalizedSearch);
    });

    setSearchResults(results);
    setShowResults(true);
  }, [searchTerm, filteredHardware, selectedHardware]);

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
    if (selectedHardware.length === 0 || latestHardware.length === 0) return;

    let hasUpdates = false;
    const updatedHardware = selectedHardware.map(selectedItem => {
      // Buscar el herraje en la base de datos actualizada
      const dbHardware = latestHardware.find(h => h.name === selectedItem.name);

      if (!dbHardware) {
        return selectedItem;
      }

      // Obtener precios actualizados con IVA
      const updatedPrices = getHardwarePriceWithIVA(
        selectedItem.name,
        latestHardware,
        materialIvaPercentage
      );

      // Calcular nuevo precio basado en el método de cobro actual
      const newPrice = selectedItem.chargingMethod === 'package'
        ? updatedPrices.pricePerPackage
        : updatedPrices.pricePerPiece;

      const newTotal = newPrice * selectedItem.quantity;

      // Verificar si los precios cambiaron
      if (
        Math.abs(updatedPrices.pricePerPackage - selectedItem.pricePerPackage) > 0.01 ||
        Math.abs(updatedPrices.pricePerPiece - selectedItem.pricePerPiece) > 0.01
      ) {
        hasUpdates = true;
        return {
          ...selectedItem,
          price: newPrice,
          total: newTotal,
          pricePerPackage: updatedPrices.pricePerPackage,
          pricePerPiece: updatedPrices.pricePerPiece
        };
      }

      return selectedItem;
    });

    if (hasUpdates) {
      onSelectedHardwareChange(updatedHardware);
      setPricesUpdated(true);
      setTimeout(() => setPricesUpdated(false), 3000);
    }
  }, [lastUpdate, materialIvaPercentage, latestHardware]);

  const handleAddHardware = (item: Hardware) => {
    // Obtener precios con IVA usando la función de utilidades
    const pricesWithIVA = getHardwarePriceWithIVA(item.name, [item], materialIvaPercentage);
    
    // Determine default charging method based on available prices
    let defaultChargingMethod: 'package' | 'piece' = 'piece';
    if (pricesWithIVA.pricePerPackage > 0 && pricesWithIVA.pricePerPiece === 0) {
      defaultChargingMethod = 'package';
    }
    
    const price = defaultChargingMethod === 'package' ? pricesWithIVA.pricePerPackage : pricesWithIVA.pricePerPiece;
    
    const newItem = {
      id: crypto.randomUUID(),
      name: item.name,
      quantity: 1,
      price: defaultChargingMethod === 'package' ? pricesWithIVA.pricePerPackage : pricesWithIVA.pricePerPiece,
      total: defaultChargingMethod === 'package' ? pricesWithIVA.pricePerPackage : pricesWithIVA.pricePerPiece,
      chargingMethod: defaultChargingMethod,
      pricePerPackage: pricesWithIVA.pricePerPackage,
      pricePerPiece: pricesWithIVA.pricePerPiece
    };
    
    onSelectedHardwareChange([...selectedHardware, newItem]);
    setSearchTerm('');
    setShowResults(false);
    
    // Keep focus on the search input after adding an item
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleRemoveHardware = (index: number) => {
    onSelectedHardwareChange(selectedHardware.filter((_, i) => i !== index));
    // Mantener el foco en el campo de búsqueda después de eliminar
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleQuantityChange = (index: number, newQuantity: number) => {
    // Permitir valores de 0 o mayores
    if (newQuantity < 0) return;
    
    const updated = [...selectedHardware];
    updated[index].quantity = newQuantity;
    updated[index].total = newQuantity * updated[index].price;
    onSelectedHardwareChange(updated);
  };
  
  const handleChargingMethodChange = (index: number, method: 'package' | 'piece') => {
    const updated = [...selectedHardware];
    const item = updated[index];
    
    // Update charging method and unit price
    item.chargingMethod = method;
    item.price = method === 'package' ? item.pricePerPackage : item.pricePerPiece;
    
    // Recalculate total
    item.total = item.quantity * item.price;
    
    onSelectedHardwareChange(updated);
  };

  // Calculate total cost of selected hardware
  const totalCost = selectedHardware.reduce((sum, item) => sum + item.total, 0);

  // Display full hardware name
  const displayName = (name: string) => {
    return name;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="text-lg font-bold text-[#003366] mb-2">HERRAJES</h4>
        {pricesUpdated && (
          <div className="flex items-center gap-1 text-green-600 text-sm animate-pulse">
            <RefreshCw size={14} />
            <span>Precios actualizados</span>
          </div>
        )}
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
            placeholder="Buscar herrajes (carretillas, cierres, tornillos, etc.)..."
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
                const hasPrice = parseFloat(item.pricePerPackage) > 0 || parseFloat(item.pricePerPiece) > 0;
                
                // Obtener precios con IVA para mostrar
                const pricesWithIVA = hasPrice ? getHardwarePriceWithIVA(item.name, [item], materialIvaPercentage) : { pricePerPackage: 0, pricePerPiece: 0 };
                
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between px-4 py-2 rounded ${
                      hasPrice ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{displayName(item.name)}</span>
                      {hasPrice && (
                        <div className="text-sm text-gray-500">
                          {pricesWithIVA.pricePerPackage > 0 && `$${pricesWithIVA.pricePerPackage.toFixed(2)}/paquete`}
                          {pricesWithIVA.pricePerPackage > 0 && pricesWithIVA.pricePerPiece > 0 && ' - '}
                          {pricesWithIVA.pricePerPiece > 0 && `$${pricesWithIVA.pricePerPiece.toFixed(2)}/pieza`}
                        </div>
                      )}
                    </div>
                    {hasPrice && (
                      <button
                        onClick={() => handleAddHardware(item)}
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
      
      {/* Selected hardware list */}
      {selectedHardware.length > 0 ? (
        <div className="space-y-4">
          {selectedHardware.map((item, index) => {
            const itemId = item.id || `hardware-${index}`;
            return (
            <div key={itemId} className="p-3 bg-blue-50 rounded-lg">
              {/* Versión móvil */}
              <div className="md:hidden">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{displayName(item.name)}</div>
                  <button
                    onClick={() => handleRemoveHardware(index)}
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
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
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
                      onChange={(e) => handleChargingMethodChange(index, e.target.value as 'package' | 'piece')}
                      className="px-2 py-1 border rounded text-sm w-full"
                      disabled={item.pricePerPackage === 0 || item.pricePerPiece === 0}
                    >
                      <option value="package" disabled={item.pricePerPackage === 0}>Por paquete</option>
                      <option value="piece" disabled={item.pricePerPiece === 0}>Por pieza</option>
                    </select>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">Total:</div>
                  <div className="font-bold">${item.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">
                    ${item.price.toFixed(2)}/{item.chargingMethod === 'package' ? 'paquete' : 'pieza'}
                  </div>
                </div>
              </div>
              
              {/* Versión desktop */}
              <div className="hidden md:flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{displayName(item.name)}</p>
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
                      value={item.quantity || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
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
                    onChange={(e) => handleChargingMethodChange(index, e.target.value as 'package' | 'piece')}
                    className="px-2 py-1 border rounded text-sm"
                    disabled={item.pricePerPackage === 0 || item.pricePerPiece === 0}
                  >
                    <option value="package" disabled={item.pricePerPackage === 0}>Por paquete</option>
                    <option value="piece" disabled={item.pricePerPiece === 0}>Por pieza</option>
                  </select>
                </div>
                <div className="text-right mr-2">
                  <p className="font-bold">${item.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    ${item.price.toFixed(2)}/{item.chargingMethod === 'package' ? 'paquete' : 'pieza'}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveHardware(index)}
                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            );
          })}
          
          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg mt-2">
            <span className="font-medium">Total herrajes:</span>
            <span className="font-bold">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay herrajes seleccionados</p>
          <p className="text-sm text-gray-400 mt-1">Busca y agrega herrajes desde la lista</p>
        </div>
      )}
    </div>
  );
}