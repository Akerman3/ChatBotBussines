import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4 mt-20 bg-white rounded-3xl shadow-2xl animate-slide-down overflow-hidden">
        <div className="w-full bg-white border-b border-gray-200 py-4 px-6 flex items-center">
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 transition-colors mr-4"
            aria-label="Cerrar tutoriales"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Tutoriales de ayuda</h2>
        </div>

        <div className="w-full h-[calc(100vh-200px)] bg-white overflow-y-auto p-6">
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
