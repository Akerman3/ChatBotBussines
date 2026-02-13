import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Calculator, DollarSign, Package, Search, X, Minus, FolderOpen } from 'lucide-react';
import { ProfileSearchAndSelection } from './ProfileSearchAndSelection';
import { HardwareSearchAndSelection } from './HardwareSearchAndSelection';
import { GlassSearchAndSelection } from './GlassSearchAndSelection';
import { SavedGeneralQuotesModal } from './SavedGeneralQuotesModal';
import { useSyncedState } from '../hooks/useSyncedState';
import { getProfilePriceWithIVA, getHardwarePriceWithIVA, getGlassPriceWithIVA } from '../utils/priceCalculations';

interface Profile {
  name: string;
  colors: {
    [key: string]: {
      price6m: string;
      pricePerM: string;
    };
  };
}

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

interface SelectedProfile {
  name: string;
  color: string;
  price6m: number;
  pricePerM: number;
  quantity: number;
  chargingMethod: 'complete' | 'meter';
  id?: string;
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

interface ExtraCost {
  id: string;
  name: string;
  amount: number;
}

interface GeneralQuoteCalculatorProps {
  onBack: () => void;
}

const AVAILABLE_COLORS = [
  'Blanco',
  'Negro',
  'Natural',
  'Natural Brillante',
  'Champagne Mate',
  'Champagne Brillante',
  'Madera',
  'Madera Nogal Texturizado',
  'Gris Europa',
  'Bronce Oscuro'
];

export function GeneralQuoteCalculator({ onBack }: GeneralQuoteCalculatorProps) {
  console.log('🔍 GeneralQuoteCalculator - Componente renderizado. Props:', { onBack });

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [glass, setGlass] = useState<Glass[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useSyncedState<SelectedProfile[]>('generalQuoteSelectedProfiles', []);
  const [selectedHardware, setSelectedHardware] = useSyncedState<SelectedHardware[]>('generalQuoteSelectedHardware', []);
  const [selectedGlass, setSelectedGlass] = useSyncedState<SelectedGlass[]>('generalQuoteSelectedGlass', []);
  const [profitPercentage, setProfitPercentage] = useSyncedState<number>('generalQuoteProfitPercentage', 0);
  const [ivaPercentage, setIvaPercentage] = useSyncedState<number>('generalQuoteIvaPercentage', 0);
  const [materialIvaPercentage] = useSyncedState<number>('materialIvaPercentage', 0);
  const [extraCostsList, setExtraCostsList] = useSyncedState<ExtraCost[]>('generalQuoteExtraCostsList', []);
  const [newExtraCostName, setNewExtraCostName] = useSyncedState<string>('generalQuoteNewExtraCostName', '');
  const [newExtraCostAmount, setNewExtraCostAmount] = useSyncedState<number>('generalQuoteNewExtraCostAmount', 0);
  const [quoteName, setQuoteName] = useSyncedState<string>('generalQuoteName', '');
  const [currentQuoteId, setCurrentQuoteId] = useSyncedState<string | null>('generalQuoteCurrentId', null);
  const [showSavedQuotesModal, setShowSavedQuotesModal] = useState(false);

  useEffect(() => {
    // Cargar perfiles
    const savedProfiles = localStorage.getItem('windowProfiles');
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (error) {
        console.error('Error loading profiles:', error);
      }
    }

    // Cargar herrajes
    const savedHardware = localStorage.getItem('windowHardware');
    if (savedHardware) {
      try {
        setHardware(JSON.parse(savedHardware));
      } catch (error) {
        console.error('Error loading hardware:', error);
      }
    }

    // Cargar vidrios
    const savedGlass = localStorage.getItem('windowGlass');
    if (savedGlass) {
      try {
        setGlass(JSON.parse(savedGlass));
      } catch (error) {
        console.error('Error loading glass:', error);
      }
    }
  }, []);

  const handleAddExtraCost = () => {
    if (!newExtraCostName.trim() || newExtraCostAmount <= 0) {
      alert('Por favor ingrese un nombre válido y un monto mayor a 0');
      return;
    }

    const newExtraCost: ExtraCost = {
      id: crypto.randomUUID(),
      name: newExtraCostName.trim(),
      amount: newExtraCostAmount
    };

    setExtraCostsList(prev => [...prev, newExtraCost]);
    setNewExtraCostName('');
    setNewExtraCostAmount(0);
  };

  const handleRemoveExtraCost = (id: string) => {
    setExtraCostsList(prev => prev.filter(cost => cost.id !== id));
  };

  const handleSaveQuote = () => {
    if (!quoteName.trim()) {
      alert('Por favor ingrese un nombre para la cotización');
      return;
    }

    if (selectedProfiles.length === 0 && selectedHardware.length === 0 && selectedGlass.length === 0) {
      alert('Por favor agregue al menos un perfil, herraje o vidrio');
      return;
    }

    const quoteData = {
      id: currentQuoteId || crypto.randomUUID(),
      name: quoteName,
      date: new Date().toISOString(),
      type: 'general',
      selectedProfiles,
      selectedHardware,
      selectedGlass,
      extraCostsList,
      profitPercentage,
      ivaPercentage,
      materialIvaPercentage,
      totals: {
        profilesCost: totalProfilesCost,
        hardwareCost: totalHardwareCost,
        glassCost: totalGlassCost,
        extraCosts: totalExtraCosts,
        subtotal: subtotal,
        profitAmount: profitAmount,
        priceWithProfit: priceWithProfit,
        ivaAmount: ivaAmount,
        finalPriceWithIVA: finalPriceWithIVA
      }
    };

    console.log('Guardando cotización con precios CON IVA:', {
      nombre: quoteName,
      ivaPercentage: ivaPercentage,
      perfiles: selectedProfiles.map(p => ({
        name: p.name,
        color: p.color,
        price6m: p.price6m,
        pricePerM: p.pricePerM,
        chargingMethod: p.chargingMethod,
        quantity: p.quantity
      })),
      herrajes: selectedHardware.map(h => ({
        name: h.name,
        price: h.price,
        total: h.total,
        pricePerPackage: h.pricePerPackage,
        pricePerPiece: h.pricePerPiece,
        chargingMethod: h.chargingMethod,
        quantity: h.quantity
      })),
      vidrios: selectedGlass.map(g => ({
        name: g.name,
        price: g.price,
        total: g.total,
        pricePerPiece: g.pricePerPiece,
        pricePerM2: g.pricePerM2,
        chargingMethod: g.chargingMethod,
        quantity: g.quantity
      })),
      totales: quoteData.totals
    });

    const savedQuotes = JSON.parse(localStorage.getItem('savedGeneralQuotes') || '[]');

    if (currentQuoteId) {
      const quoteIndex = savedQuotes.findIndex((q: any) => q.id === currentQuoteId);
      if (quoteIndex !== -1) {
        savedQuotes[quoteIndex] = quoteData;
        alert('¡Cotización actualizada exitosamente!');
      } else {
        savedQuotes.push(quoteData);
        alert('¡Cotización guardada exitosamente!');
      }
    } else {
      savedQuotes.push(quoteData);
      setCurrentQuoteId(quoteData.id);
      alert('¡Cotización guardada exitosamente!');
    }

    localStorage.setItem('savedGeneralQuotes', JSON.stringify(savedQuotes));

    // Limpiar formulario
    setSelectedProfiles([]);
    setSelectedHardware([]);
    setSelectedGlass([]);
    setExtraCostsList([]);
    setProfitPercentage(0);
    setIvaPercentage(16);
    setQuoteName('');
    setCurrentQuoteId(null);
  };

  const handleLoadGeneralQuote = (quote: any) => {
    console.log('Cargando cotización SIN recalcular precios:', {
      nombre: quote.name,
      ivaGuardado: quote.ivaPercentage,
      perfiles: quote.selectedProfiles,
      herrajes: quote.selectedHardware,
      vidrios: quote.selectedGlass,
      totales: quote.totals
    });

    setSelectedProfiles(quote.selectedProfiles || []);
    setSelectedHardware(quote.selectedHardware || []);
    setSelectedGlass(quote.selectedGlass || []);
    setExtraCostsList(quote.extraCostsList || []);
    setProfitPercentage(quote.profitPercentage || 0);
    setIvaPercentage(quote.ivaPercentage !== undefined ? quote.ivaPercentage : 0);
    setQuoteName(quote.name || '');
    setCurrentQuoteId(quote.id || null);
    setNewExtraCostName('');
    setNewExtraCostAmount(0);

    setShowSavedQuotesModal(false);
    alert(`Cotización "${quote.name}" cargada exitosamente!`);
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro que deseas borrar toda la cotización? Esta acción no se puede deshacer.')) {
      setSelectedProfiles([]);
      setSelectedHardware([]);
      setSelectedGlass([]);
      setExtraCostsList([]);
      setProfitPercentage(0);
      setIvaPercentage(16);
      setQuoteName('');
      setCurrentQuoteId(null);
      setNewExtraCostName('');
      setNewExtraCostAmount(0);
    }
  };

  // Cálculos
  const totalProfilesCost = selectedProfiles.reduce((sum, profile) => {
    return sum + (profile.chargingMethod === 'complete'
      ? profile.price6m * profile.quantity
      : profile.pricePerM * profile.quantity);
  }, 0);

  const totalHardwareCost = selectedHardware.reduce((sum, item) => sum + item.total, 0);
  const totalGlassCost = selectedGlass.reduce((sum, item) => sum + item.total, 0);
  const totalExtraCosts = extraCostsList.reduce((sum, cost) => sum + cost.amount, 0);
  const subtotal = totalProfilesCost + totalHardwareCost + totalGlassCost;
  const profitAmount = subtotal * (profitPercentage / 100);
  const priceWithProfit = subtotal + profitAmount + totalExtraCosts;
  const ivaAmount = priceWithProfit * (ivaPercentage / 100);
  const finalPriceWithIVA = priceWithProfit + ivaAmount;

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center px-4 animate-fade-in">
      <div className="w-full pt-6 px-6 flex justify-between items-center">
        <button
          onClick={() => {
            console.log('🔍 GeneralQuoteCalculator - Clic en botón de retroceso. Llamando a onBack.');
            onBack();
          }}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver al menú anterior"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSavedQuotesModal(true)}
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-1 text-sm"
          >
            <FolderOpen size={16} />
            <span className="hidden sm:inline">Ver Cotizaciones</span>
          </button>
          
          <button
            onClick={handleClearAll}
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Borrar Todo</span>
            <span className="sm:hidden">Borrar</span>
          </button>
        </div>
      </div>

      {/* Modal de cotizaciones guardadas */}
      {showSavedQuotesModal && (
        <SavedGeneralQuotesModal
          onClose={() => setShowSavedQuotesModal(false)}
          onLoadQuote={handleLoadGeneralQuote}
        />
      )}

      <div className="text-center my-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calculator size={48} className="text-white" />
          <h1 className="text-white text-5xl font-bold">COTIZADOR GENERAL</h1>
        </div>
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">COTIZACIÓN PERSONALIZADA</span>
        </div>
      </div>

      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Selección de elementos */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-[#003366] mb-6 flex items-center gap-2">
              <Package size={24} />
              Elementos de la Cotización
            </h2>
            
            {/* Nombre de la cotización */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Cotización
              </label>
              <input
                type="text"
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Ej: Proyecto Casa López - Cotización General"
              />
            </div>

            {/* Sección de perfiles */}
            <div className="mb-8">
              <ProfileSearchAndSelection
                profiles={profiles}
                selectedProfiles={selectedProfiles}
                onSelectedProfilesChange={setSelectedProfiles}
                lineType="all"
                availableColors={AVAILABLE_COLORS}
              />
            </div>

            {/* Sección de herrajes */}
            <div className="mb-8">
              <HardwareSearchAndSelection
                hardware={hardware}
                selectedHardware={selectedHardware}
                onSelectedHardwareChange={setSelectedHardware}
                lineType="all"
              />
            </div>

            {/* Sección de vidrios */}
            <div className="mb-8">
              <GlassSearchAndSelection
                glass={glass}
                selectedGlass={selectedGlass}
                onSelectedGlassChange={setSelectedGlass}
              />
            </div>

            {/* Sección de costos extra */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-bold text-[#003366] mb-4">COSTOS EXTRA</h4>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                💡 RECUERDA QUE LOS COSTOS ADICIONALES NO SE LE SUMA EL PORCENTAJE DE GANANCIA
              </p>
              
              {/* Lista de costos extra */}
              {extraCostsList.length > 0 && (
                <div className="space-y-2 mb-4">
                  {extraCostsList.map((cost) => (
                    <div key={cost.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{cost.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">${cost.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemoveExtraCost(cost.id)}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar nuevo costo extra */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <input
                  type="text"
                  value={newExtraCostName}
                  onChange={(e) => setNewExtraCostName(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Nombre del costo (ej: Flete)"
                />
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newExtraCostAmount === 0 ? '' : newExtraCostAmount}
                    onChange={(e) => setNewExtraCostAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <button
                  onClick={handleAddExtraCost}
                  className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>

              {extraCostsList.length === 0 && (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No hay costos extra agregados</p>
                  <p className="text-sm text-gray-400 mt-1">Agrega costos como flete, instalación, etc.</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Resumen y totales */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-[#003366] mb-6 flex items-center gap-2">
              <DollarSign size={24} />
              Resumen de Cotización
            </h2>

            {(selectedProfiles.length > 0 || selectedHardware.length > 0 || selectedGlass.length > 0 || extraCostsList.length > 0) ? (
              <div className="space-y-6">
                {/* Resumen de costos */}
                <div className="space-y-4">
                  {totalProfilesCost > 0 && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-[#003366]">Total Perfiles:</span>
                      <span className="font-bold text-[#003366]">${totalProfilesCost.toFixed(2)}</span>
                    </div>
                  )}

                  {totalHardwareCost > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-[#003366]">Total Herrajes:</span>
                      <span className="font-bold text-[#003366]">${totalHardwareCost.toFixed(2)}</span>
                    </div>
                  )}

                  {totalGlassCost > 0 && (
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-[#003366]">Total Vidrios:</span>
                      <span className="font-bold text-[#003366]">${totalGlassCost.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2 border-gray-300">
                    <span className="font-bold text-[#003366]">SUBTOTAL:</span>
                    <span className="font-bold text-[#003366] text-lg">${subtotal.toFixed(2)}</span>
                  </div>

                  {totalExtraCosts > 0 && (
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-[#003366]">Total Costos Extra:</span>
                      <span className="font-bold text-[#003366]">${totalExtraCosts.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Configuración de ganancia */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-[#003366]">PORCENTAJE DE GANANCIA:</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.1"
                        value={profitPercentage === 0 ? '' : profitPercentage}
                        onChange={(e) => setProfitPercentage(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-right"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  </div>

                  {profitAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg mb-4">
                      <span className="font-medium text-[#003366]">Ganancia:</span>
                      <span className="font-bold text-[#003366]">${profitAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg">
                    <span className="font-bold text-[#003366]">PRECIO FINAL:</span>
                    <span className="font-bold text-[#003366] text-xl">${priceWithProfit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Configuración de IVA Adicional */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-[#003366]">IVA Adicional:</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={ivaPercentage === 0 ? '' : ivaPercentage}
                        onChange={(e) => setIvaPercentage(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-right"
                        placeholder="0.00"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-yellow-100 rounded-lg mb-4">
                    <span className="font-medium text-[#003366]">Monto IVA Adicional:</span>
                    <span className="font-bold text-[#003366]">${ivaAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-green-200 rounded-lg border-2 border-green-400">
                    <span className="font-bold text-[#003366] text-lg">PRECIO FINAL CON IVA:</span>
                    <span className="font-bold text-[#003366] text-2xl">${finalPriceWithIVA.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600 mt-2">
                    Precio base: ${priceWithProfit.toFixed(2)} + IVA Adicional ({ivaPercentage}%): ${ivaAmount.toFixed(2)}
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-1">
                    Nota: Los precios de materiales ya incluyen 16% IVA de la base de datos
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveQuote}
                      className="flex-1 bg-[#003366] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      Guardar Cotización
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator size={64} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Cotización Vacía</h3>
                <p className="text-gray-500">
                  Agrega perfiles, herrajes o costos extra para comenzar tu cotización
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}