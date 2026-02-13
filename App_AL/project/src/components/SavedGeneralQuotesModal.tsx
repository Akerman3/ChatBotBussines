import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Calendar, DollarSign, Package, Eye } from 'lucide-react';
import { usePriceUpdates } from '../hooks/usePriceUpdates';
import { recalculateGeneralQuotation } from '../utils/priceCalculations';

interface SavedGeneralQuote {
  id: string;
  name: string;
  date: string;
  type: 'general';
  selectedProfiles: any[];
  selectedHardware: any[];
  selectedGlass?: any[];
  extraCostsList: any[];
  profitPercentage: number;
  ivaPercentage: number;
  totals: {
    profilesCost: number;
    hardwareCost: number;
    glassCost?: number;
    extraCosts: number;
    subtotal: number;
    profitAmount: number;
    priceWithProfit: number;
    ivaAmount: number;
    finalPriceWithIVA: number;
  };
}

interface SavedGeneralQuotesModalProps {
  onClose: () => void;
  onLoadQuote: (quote: SavedGeneralQuote) => void;
}

export function SavedGeneralQuotesModal({ onClose, onLoadQuote }: SavedGeneralQuotesModalProps) {
  const [savedQuotes, setSavedQuotes] = useState<SavedGeneralQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<SavedGeneralQuote | null>(null);
  const { priceData, hasUpdates } = usePriceUpdates();

  const loadAndRecalculateQuotes = () => {
    const quotesString = localStorage.getItem('savedGeneralQuotes');
    if (quotesString) {
      try {
        const quotes = JSON.parse(quotesString);

        const recalculatedQuotes = quotes.map((quote: SavedGeneralQuote) => {
          return recalculateGeneralQuotation(
            quote,
            priceData.profiles,
            priceData.hardware,
            priceData.glass,
            priceData.materialIvaPercentage
          );
        });

        setSavedQuotes(recalculatedQuotes);
        localStorage.setItem('savedGeneralQuotes', JSON.stringify(recalculatedQuotes));

        if (selectedQuote) {
          const updatedSelectedQuote = recalculatedQuotes.find((q: SavedGeneralQuote) => q.id === selectedQuote.id);
          if (updatedSelectedQuote) {
            setSelectedQuote(updatedSelectedQuote);
          }
        }

        console.log('Cotizaciones recalculadas con precios actualizados:', recalculatedQuotes);
      } catch (error) {
        console.error('Error loading general quotes:', error);
        setSavedQuotes([]);
      }
    }
  };

  useEffect(() => {
    loadAndRecalculateQuotes();
  }, []);

  useEffect(() => {
    if (hasUpdates) {
      console.log('Detectados cambios en precios, recalculando cotizaciones...');
      loadAndRecalculateQuotes();
    }
  }, [hasUpdates, priceData]);

  const handleDeleteQuote = (id: string) => {
    if (confirm('¿Estás seguro que deseas eliminar esta cotización general?')) {
      const updatedQuotes = savedQuotes.filter(quote => quote.id !== id);
      setSavedQuotes(updatedQuotes);
      localStorage.setItem('savedGeneralQuotes', JSON.stringify(updatedQuotes));
      if (selectedQuote?.id === id) {
        setSelectedQuote(null);
      }
    }
  };

  const handleLoadQuote = (quote: SavedGeneralQuote) => {
    onLoadQuote(quote);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col sm:flex-row relative">
        {/* Etiqueta de notificación de actualización de precios */}
        {hasUpdates && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 animate-fade-in">
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-1 rounded-full text-xs shadow-md">
              Se actualizaron algunos precios
            </div>
          </div>
        )}

        {/* Lista de cotizaciones */}
        <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-gray-200 p-4 sm:p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003366]">Cotizaciones Generales Guardadas</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} className="sm:size-[24px]" />
            </button>
          </div>

          <div className="space-y-4">
            {savedQuotes.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign size={64} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay cotizaciones generales guardadas</p>
              </div>
            ) : (
              savedQuotes.slice().reverse().map((quote) => (
                <div
                  key={quote.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedQuote?.id === quote.id
                      ? 'border-[#003366] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedQuote(quote)}
                >
                  <div className="flex justify-between items-start text-sm sm:text-base">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#003366] text-base sm:text-lg">{quote.name}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                        <Calendar size={12} className="sm:size-[14px]" />
                        <span>{formatDate(quote.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Package size={12} className="sm:size-[14px]" />
                          <span>{quote.selectedProfiles.length + quote.selectedHardware.length + (quote.selectedGlass?.length || 0)} elementos</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadQuote(quote);
                        }}
                        className="p-1 sm:p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Cargar cotización"
                      >
                        <Edit2 size={16} className="sm:size-[18px]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuote(quote.id);
                        }}
                        className="p-1 sm:p-2 text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar cotización"
                      >
                        <Trash2 size={16} className="sm:size-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalles de la cotización seleccionada */}
        <div className="w-full sm:flex-1 p-4 sm:p-6 overflow-y-auto">
          {selectedQuote ? (
            <div>
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#003366] mb-2">
                  {selectedQuote.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600 text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Calendar size={14} className="sm:size-[16px]" />
                    <span>{formatDate(selectedQuote.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Package size={14} className="sm:size-[16px]" />
                    <span>{selectedQuote.selectedProfiles.length + selectedQuote.selectedHardware.length + (selectedQuote.selectedGlass?.length || 0)} elementos</span>
                  </div>
                </div>
              </div>

              {/* Resumen de perfiles */}
              {selectedQuote.selectedProfiles.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-bold text-[#003366] mb-3">Perfiles Utilizados</h4>
                  <div className="space-y-2">
                    {selectedQuote.selectedProfiles.map((profile, index) => (
                      <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-sm sm:text-base">{profile.name}</span>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Color: {profile.color} | Cantidad: {profile.quantity} | 
                            Método: {profile.chargingMethod === 'complete' ? 'Por pieza' : 'Por metro'}
                          </div>
                        </div>
                        <span className="font-bold text-[#003366] text-sm sm:text-base">
                          ${(profile.chargingMethod === 'complete' 
                            ? profile.price6m * profile.quantity 
                            : profile.pricePerM * profile.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de herrajes */}
              {selectedQuote.selectedHardware.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-bold text-[#003366] mb-3">Herrajes Utilizados</h4>
                  <div className="space-y-2">
                    {selectedQuote.selectedHardware.map((hardware, index) => (
                      <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-sm sm:text-base">{hardware.name}</span>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Cantidad: {hardware.quantity} | 
                            Método: {hardware.chargingMethod === 'package' ? 'Por paquete' : 'Por pieza'}
                          </div>
                        </div>
                        <span className="font-bold text-[#003366] text-sm sm:text-base">${hardware.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de vidrios */}
              {selectedQuote.selectedGlass && selectedQuote.selectedGlass.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-bold text-[#003366] mb-3">Vidrios Utilizados</h4>
                  <div className="space-y-2">
                    {selectedQuote.selectedGlass.map((glass, index) => (
                      <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-sm sm:text-base">{glass.name}</span>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Cantidad: {glass.quantity} | 
                            Método: {glass.chargingMethod === 'piece' ? 'Por pieza' : 'Por m²'}
                          </div>
                        </div>
                        <span className="font-bold text-[#003366] text-sm sm:text-base">${glass.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de costos extra */}
              {selectedQuote.extraCostsList.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-bold text-[#003366] mb-3">Costos Extra</h4>
                  <div className="space-y-2">
                    {selectedQuote.extraCostsList.map((cost, index) => (
                      <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-sm sm:text-base">{cost.name}</span>
                        <span className="font-bold text-[#003366] text-sm sm:text-base">${cost.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen financiero */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-base sm:text-lg font-bold text-green-800 mb-3">Resumen Financiero</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedQuote.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ganancia ({selectedQuote.profitPercentage}%):</span>
                    <span>{formatCurrency(selectedQuote.totals.profitAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio con ganancia:</span>
                    <span>{formatCurrency(selectedQuote.totals.priceWithProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({selectedQuote.ivaPercentage}%):</span>
                    <span>{formatCurrency(selectedQuote.totals.ivaAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                    <span>Total Final:</span>
                    <span className="text-green-600">{formatCurrency(selectedQuote.totals.finalPriceWithIVA)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleLoadQuote(selectedQuote)}
                  className="w-full bg-[#003366] text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Edit2 size={16} className="sm:size-[20px]" />
                  Cargar y Editar Cotización
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Eye size={48} className="mx-auto mb-4 text-gray-400 sm:size-[64px]" />
                <p className="text-sm sm:text-base">Selecciona una cotización para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}