import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface SaveDoorFormulaPiecePackageModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SaveDoorFormulaPiecePackageModal({ onClose, onSave }: SaveDoorFormulaPiecePackageModalProps) {
  const [packageName, setPackageName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!packageName.trim()) {
      setError('Por favor ingrese un nombre para el paquete');
      return;
    }
    onSave(packageName.trim());
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-2">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003366]">Guardar Paquete de Fórmulas de Puertas</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nombre del Paquete
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => {
                  setPackageName(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: Proyecto Puertas Personalizadas"
                autoFocus
              />
              {error && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 sm:gap-4 pt-4">
              <button
                onClick={onClose}
                className="px-3 py-1 sm:px-4 sm:py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1 sm:px-6 sm:py-2 bg-[#003366] text-white rounded-md hover:bg-blue-800 transition-colors flex items-center gap-1 sm:gap-2 text-sm"
              >
                <Save size={16} className="sm:size-[18px]" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
