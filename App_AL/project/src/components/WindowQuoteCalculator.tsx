import React, { useState } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { FixedSlidingCalculator } from './FixedSlidingCalculator';
import { DoubleSlidingQuoteCalculator } from './DoubleSlidingQuoteCalculator';
import { TwoFixedTwoSlidingQuoteCalculator } from './TwoFixedTwoSlidingQuoteCalculator';
import { FourSlidingQuoteCalculator } from './FourSlidingQuoteCalculator';
import { FixedSlidingQuoteCalculatorLine2 } from './FixedSlidingQuoteCalculatorLine2';
import { DoubleSlidingQuoteCalculatorLine2 } from './DoubleSlidingQuoteCalculatorLine2';
import { PackageQuoteManager } from './PackageQuoteManager';

interface WindowQuoteCalculatorProps {
  onBack: () => void;
}

function WindowIcon({ panels }: { panels: number }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#003366"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <rect x="4" y="4" width="16" height="16" />
      {panels === 2 && (
        <line x1="12" y1="4" x2="12" y2="20" />
      )}
      {panels === 4 && (
        <>
          <line x1="8" y1="4" x2="8" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="16" y1="4" x2="16" y2="20" />
        </>
      )}
    </svg>
  );
}

export function WindowQuoteCalculator({ onBack }: WindowQuoteCalculatorProps) {
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);

  if (selectedWindow === 'fixed-sliding') {
    return <FixedSlidingCalculator onBack={() => setSelectedWindow(null)} />;
  }

  if (selectedWindow === 'double-sliding') {
    return <DoubleSlidingQuoteCalculator onBack={() => setSelectedWindow(null)} />;
  }

  if (selectedWindow === 'two-fixed-two-sliding') {
    return <TwoFixedTwoSlidingQuoteCalculator onBack={() => setSelectedWindow(null)} />;
  }

  if (selectedWindow === 'four-sliding') {
    return <FourSlidingQuoteCalculator onBack={() => setSelectedWindow(null)} />;
  }

  if (selectedWindow === 'fixed-sliding-line2') {
    return <FixedSlidingQuoteCalculatorLine2 onBack={() => setSelectedWindow(null)} />;
  }

  if (selectedWindow === 'double-sliding-line2') {
    return <DoubleSlidingQuoteCalculatorLine2 onBack={() => setSelectedWindow(null)} />;
  }

  if (selectedWindow === 'package-manager') {
    return <PackageQuoteManager onBack={() => setSelectedWindow(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center px-4 animate-fade-in">
      <div className="w-full pt-6 px-6">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver al menú anterior"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="text-center my-8">
        <h1 className="text-white text-5xl font-bold">VENTANAS</h1>
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full mt-4">
          <span className="font-bold">LÍNEA NACIONAL DE 3</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-xl">
        <button 
          className="flex flex-col items-center group"
          onClick={() => setSelectedWindow('fixed-sliding')}
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <WindowIcon panels={2} />
          </div>
          <span className="text-white text-sm font-medium">FIJO CORREDIZO</span>
        </button>

        <button 
          className="flex flex-col items-center group"
          onClick={() => setSelectedWindow('double-sliding')}
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <WindowIcon panels={2} />
          </div>
          <span className="text-white text-sm font-medium">DOBLE CORREDIZO</span>
        </button>

        <button 
          className="flex flex-col items-center group"
          onClick={() => setSelectedWindow('two-fixed-two-sliding')}
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <WindowIcon panels={4} />
          </div>
          <span className="text-white text-sm font-medium">2 FIJOS 2 CORREDIZOS</span>
        </button>

        <button 
          className="flex flex-col items-center group"
          onClick={() => setSelectedWindow('four-sliding')}
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <WindowIcon panels={4} />
          </div>
          <span className="text-white text-sm font-medium">4 CORREDIZAS</span>
        </button>
      </div>

      <div className="text-center mt-12">
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">LÍNEA NACIONAL DE 2</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-xl mt-8">
        <button 
          className="flex flex-col items-center group"
          onClick={() => setSelectedWindow('fixed-sliding-line2')}
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <WindowIcon panels={2} />
          </div>
          <span className="text-white text-sm font-medium">FIJO CORREDIZO</span>
        </button>

        <button 
          className="flex flex-col items-center group"
          onClick={() => setSelectedWindow('double-sliding-line2')}
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <WindowIcon panels={2} />
          </div>
          <span className="text-white text-sm font-medium">DOBLE CORREDIZA</span>
        </button>
      </div>

      <div className="text-center mt-12">
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">ALMACENADOR DE COTIZACIÓN</span>
        </div>
      </div>

      <div className="flex items-center justify-center mt-8">
        <button 
          className="flex flex-col items-center group"
          onClick={() => setSelectedWindow('package-manager')}
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <Package size={48} className="text-[#003366]" />
          </div>
          <span className="text-white text-sm font-medium">PAQUETE COTIZADO</span>
        </button>
      </div>

      <div className="text-center mt-12 mb-8">
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">SERIE 50 ...</span>
        </div>
        <p className="text-white text-lg mt-4 font-medium">Próximamente</p>
      </div>
    </div>
  );
}