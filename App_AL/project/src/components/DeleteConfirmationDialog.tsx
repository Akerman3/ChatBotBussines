import React from 'react';
import { X } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}

export function DeleteConfirmationDialog({ isOpen, onClose, onConfirm, itemName, itemType = 'perfil' }: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#003366]">Confirmar Eliminación</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-8">
            <p className="text-gray-700">
              ¿Estás seguro que deseas eliminar el {itemType} <span className="font-bold">{itemName}</span>?
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}