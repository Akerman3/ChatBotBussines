import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface SaveQuoteModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
}

export function SaveQuoteModal({ onClose, onSave, initialName }: SaveQuoteModalProps) {
  const [quoteName, setQuoteName] = useState(initialName || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!quoteName.trim()) {
      setError('Por favor ingrese un nombre para la cotización');
      return;
    }
    onSave(quoteName.trim());
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#003366]">
              {initialName ? 'Actualizar Cotización' : 'Guardar Cotización'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Cotización
              </label>
              <input
                type="text"
                value={quoteName}
                onChange={(e) => {
                  setQuoteName(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Cotización Casa López - Enero 2025"
                autoFocus
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#003366] text-white rounded-md hover:bg-blue-800 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                {initialName ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}