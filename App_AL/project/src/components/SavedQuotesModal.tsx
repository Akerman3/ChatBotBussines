import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Calendar, DollarSign, Package } from 'lucide-react';
import { recalculateSavedQuotation } from '../utils/priceCalculations';

interface SavedQuote {
  id: string;
  name: string;
  date: string;
  totalAmount: number;
  windowsCount: number;
  profilesUsed: string[];
  hardwareUsed?: string[];
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

interface Hardware {
  name: string;
  pricePerPackage: string;
  pricePerPiece: string;
}

interface SavedQuotesModalProps {
  onClose: () => void;
  onLoadQuote: (quote: SavedQuote) => void;
}

export function SavedQuotesModal({ onClose, onLoadQuote }: SavedQuotesModalProps) {
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);

  useEffect(() => {
    const quotesString = localStorage.getItem('savedQuotedPackages');
    if (quotesString) {
      try {
        const quotes = JSON.parse(quotesString);

        const profilesString = localStorage.getItem('windowProfiles');
        const hardwareString = localStorage.getItem('windowHardware');

        let profiles: Profile[] = [];
        let hardware: Hardware[] = [];

        if (profilesString) {
          try {
            profiles = JSON.parse(profilesString);
          } catch (error) {
            console.error('Error parsing profiles:', error);
          }
        }

        if (hardwareString) {
          try {
            hardware = JSON.parse(hardwareString);
          } catch (error) {
            console.error('Error parsing hardware:', error);
          }
        }

        const recalculatedQuotes = quotes.map((quote: any) => {
          return recalculateSavedQuotation(quote, profiles, hardware);
        });

        localStorage.setItem('savedQuotedPackages', JSON.stringify(recalculatedQuotes));

        setSavedQuotes(recalculatedQuotes);
      } catch (error) {
        console.error('Error loading and recalculating quotes:', error);
        setSavedQuotes([]);
      }
    }
  }, []);

  const handleDeleteQuote = (id: string) => {
    if (confirm('¿Estás seguro que deseas eliminar esta cotización?')) {
      const updatedQuotes = savedQuotes.filter(quote => quote.id !== id);
      setSavedQuotes(updatedQuotes);
      localStorage.setItem('savedQuotedPackages', JSON.stringify(updatedQuotes));
    }
  };

  const handleLoadQuote = (quote: SavedQuote) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 pt-8 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#003366]">Cotizaciones Guardadas</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {savedQuotes.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign size={64} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay cotizaciones guardadas</p>
              </div>
            ) : (
              savedQuotes.slice().reverse().map((quote) => (
                <div
                  key={quote.id}
                  className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#003366] text-xl mb-2">{quote.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{formatDate(quote.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package size={14} />
                          <span>{quote.windowsCount} ventana{quote.windowsCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadQuote(quote)}
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Cargar cotización"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar cotización"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {quote.hardwareUsed && quote.hardwareUsed.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-[#003366] mb-2">Herrajes Utilizados</h4>
                      <div className="flex flex-wrap gap-2">
                        {quote.hardwareUsed.map((hardware, index) => (
                          <div
                            key={index}
                            className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-[#003366]"
                          >
                            {hardware}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {quote.extraCostsList && quote.extraCostsList.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-[#003366] mb-2">Costos Extra</h4>
                      <div className="space-y-2">
                        {quote.extraCostsList.map((cost, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                            <span className="font-medium">{cost.name}</span>
                            <span className="font-bold text-[#003366]">${cost.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}