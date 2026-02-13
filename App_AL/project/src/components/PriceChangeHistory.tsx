import React, { useState, useEffect } from 'react';
import { X, History, RefreshCw } from 'lucide-react';
import { getPriceChangeHistory, PriceChangeRecord } from '../utils/supabasePriceSync';

interface PriceChangeHistoryProps {
  onClose: () => void;
  itemType?: 'profile' | 'hardware' | 'glass';
  itemName?: string;
}

export function PriceChangeHistory({ onClose, itemType, itemName }: PriceChangeHistoryProps) {
  const [history, setHistory] = useState<PriceChangeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const records = await getPriceChangeHistory(itemType, itemName, 100);
    setHistory(records);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [itemType, itemName]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'profile': return 'Perfil';
      case 'hardware': return 'Herraje';
      case 'glass': return 'Vidrio';
      default: return type;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'price_6m': return 'Precio 6m';
      case 'price_per_m': return 'Precio/m';
      case 'price_per_package': return 'Precio/paquete';
      case 'price_per_piece': return 'Precio/pieza';
      case 'price_per_m2': return 'Precio/m²';
      default: return field;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <History size={24} className="text-[#003366]" />
              <div>
                <h2 className="text-2xl font-bold text-[#003366]">Historial de Cambios de Precios</h2>
                {itemName && (
                  <p className="text-sm text-gray-600 mt-1">
                    Mostrando cambios para: {itemName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadHistory}
                className="p-2 text-[#003366] hover:bg-gray-100 rounded transition-colors"
                title="Recargar historial"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">
                No hay cambios registrados
              </h3>
              <p className="text-gray-500">
                {itemName
                  ? `No se han registrado cambios de precio para "${itemName}"`
                  : 'Aún no se han registrado cambios de precios en el sistema'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record, index) => {
                const priceChanged = record.new_value !== record.old_value;
                const priceIncreased = record.new_value > record.old_value;

                return (
                  <div
                    key={`${record.item_name}-${record.changed_at}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {getTypeLabel(record.item_type)}
                          </span>
                          <span className="font-bold text-[#003366]">
                            {record.item_name}
                          </span>
                          {record.item_color && (
                            <span className="text-sm text-gray-600">
                              ({record.item_color})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getFieldLabel(record.field_changed)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Anterior</div>
                          <div className="font-medium text-gray-700">
                            ${record.old_value.toFixed(2)}
                          </div>
                        </div>

                        <div className="text-2xl text-gray-400">→</div>

                        <div className="text-right">
                          <div className="text-sm text-gray-500">Nuevo</div>
                          <div className={`font-bold ${
                            priceChanged
                              ? priceIncreased
                                ? 'text-red-600'
                                : 'text-green-600'
                              : 'text-gray-700'
                          }`}>
                            ${record.new_value.toFixed(2)}
                            {priceChanged && (
                              <span className="text-xs ml-1">
                                {priceIncreased ? '↑' : '↓'}
                                {Math.abs(((record.new_value - record.old_value) / record.old_value) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {formatDate(record.changed_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <History size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Acerca del Historial de Cambios</p>
                <p className="text-blue-700">
                  Este historial registra automáticamente todos los cambios de precios realizados en la base de datos.
                  Los cambios se sincronizan en tiempo real entre todos los usuarios conectados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
