import React from 'react';
import { DoorOpen as Door, Type, Square, Columns2, Columns3, Grid3X3, RectangleHorizontal } from 'lucide-react';

interface AddComponentMenuProps {
  onClose: () => void;
  onAddComponent: (type: 'text' | 'door' | 'fixed-sliding-window' | 'double-sliding-window' | 'two-fixed-two-sliding-window' | 'four-sliding-window' | 'glass') => void;
}

export function AddComponentMenu({ onClose, onAddComponent }: AddComponentMenuProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-2">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 hover:bg-gray-100 rounded text-left transition-colors text-sm sm:text-base"
          onClick={() => {
            onAddComponent('door');
            onClose();
          }}
        >
          <Door size={18} className="text-[#003366]" />
          <span className="font-medium text-[#003366]">Agregar puerta</span>
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 hover:bg-gray-100 rounded text-left transition-colors text-sm sm:text-base"
          onClick={() => {
            onAddComponent('fixed-sliding-window');
            onClose();
          }}
        >
          <Square size={18} className="text-[#003366]" />
          <span className="font-medium text-[#003366]">Fijo Corredizo</span>
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 hover:bg-gray-100 rounded text-left transition-colors text-sm sm:text-base"
          onClick={() => {
            onAddComponent('double-sliding-window');
            onClose();
          }}
        >
          <Columns2 size={18} className="text-[#003366]" />
          <span className="font-medium text-[#003366]">Doble Corrediza</span>
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 hover:bg-gray-100 rounded text-left transition-colors text-sm sm:text-base"
          onClick={() => {
            onAddComponent('two-fixed-two-sliding-window');
            onClose();
          }}
        >
          <Columns3 size={18} className="text-[#003366]" />
          <span className="font-medium text-[#003366]">2 Fijos 2 Corredizos</span>
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 hover:bg-gray-100 rounded text-left transition-colors text-sm sm:text-base"
          onClick={() => {
            onAddComponent('four-sliding-window');
            onClose();
          }}
        >
          <Grid3X3 size={18} className="text-[#003366]" />
          <span className="font-medium text-[#003366]">4 Corredizas</span>
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 hover:bg-gray-100 rounded text-left transition-colors text-sm sm:text-base"
          onClick={() => {
            onAddComponent('glass');
            onClose();
          }}
        >
          <RectangleHorizontal size={18} className="text-[#003366]" />
          <span className="font-medium text-[#003366]">Agregar vidrio</span>
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 hover:bg-gray-100 rounded text-left transition-colors text-sm sm:text-base"
          onClick={() => {
            onAddComponent('text');
            onClose();
          }}
        >
          <Type size={18} className="text-[#003366]" />
          <span className="font-medium text-[#003366]">Agregar texto</span>
        </button>
      </div>
    </div>
  );
}