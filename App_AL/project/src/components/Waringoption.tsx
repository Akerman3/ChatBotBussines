// src/components/Waringoption.tsx
import React from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  onBack: () => void;
  title?: string; // opcional por si quieres personalizar el heading
}

const Waringoption: React.FC<Props> = ({ onBack, title }) => {
  return (
    <div className="min-h-screen bg-[#003366] flex flex-col">
      {/* Header */}
      <div className="w-full px-4 pt-5 pb-3">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Regresar"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 pb-6 flex items-stretch">
        <div className="bg-white rounded-2xl shadow-xl w-full mx-auto flex flex-col items-center justify-center">
          {/* Ícono de alerta */}
          <div className="w-40 h-40 rounded-full bg-red-600 flex items-center justify-center mb-6">
            {/* signo de exclamación */}
            <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="0" fill="none" />
              <rect x="11" y="5" width="2" height="10" rx="1" fill="#ffffff" />
              <circle cx="12" cy="18" r="1.6" fill="#ffffff" />
            </svg>
          </div>

          {/* Título opcional */}
          {title && (
            <h2 className="text-[#0b1b32] text-2xl font-extrabold mb-2">{title}</h2>
          )}

          {/* Mensaje */}
          <p className="text-[#0b1b32] text-center font-semibold tracking-wide px-6">
            OPCIÓN AÚN NO DISPONIBLE POR EL MOMENTO.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Waringoption;
