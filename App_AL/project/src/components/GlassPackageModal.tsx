import React from 'react';
import { X } from 'lucide-react';

export interface GlassInfo {
  windowNumber: number;
  windowType: string;
  calculatorType: string;
  glassType: 'fija' | 'corrediza';
  width: string;
  height: string;
  pieces: number;
  zocloUpper: string;
  zocloLower: string;
  adjustment: number;
}

interface GlassPackageModalProps {
  onClose: () => void;
  glassData: GlassInfo[];
}

export function GlassPackageModal({ onClose, glassData }: GlassPackageModalProps) {
  const getColorClasses = (calculatorType: string) => {
    switch (calculatorType) {
      case 'fixed-sliding':
        return {
          border: 'border-orange-400',
          bg: 'bg-orange-50',
          text: 'text-orange-700'
        };
      case 'double-sliding':
        return {
          border: 'border-blue-400',
          bg: 'bg-blue-50',
          text: 'text-blue-700'
        };
      case 'two-fixed-two-sliding':
        return {
          border: 'border-green-400',
          bg: 'bg-green-50',
          text: 'text-green-700'
        };
      case 'four-sliding':
        return {
          border: 'border-purple-400',
          bg: 'bg-purple-50',
          text: 'text-purple-700'
        };
      case 'line2':
        return {
          border: 'border-yellow-400',
          bg: 'bg-yellow-50',
          text: 'text-yellow-700'
        };
      default:
        return {
          border: 'border-gray-400',
          bg: 'bg-gray-50',
          text: 'text-gray-700'
        };
    }
  };

  const groupedByWindow = glassData.reduce((acc, glass) => {
    if (!acc[glass.windowNumber]) {
      acc[glass.windowNumber] = [];
    }
    acc[glass.windowNumber].push(glass);
    return acc;
  }, {} as Record<number, GlassInfo[]>);

  const windowNumbers = Object.keys(groupedByWindow).map(Number).sort((a, b) => a - b);

  const totalGlasses = glassData.reduce((sum, glass) => sum + glass.pieces, 0);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center px-4 pt-8 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#003366] px-8 py-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white">VIDRIOS CONTEMPLADOS</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={28} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8">
          {glassData.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-xl">No hay vidrios contemplados en el paquete</p>
            </div>
          ) : (
            <div className="space-y-6">
              {windowNumbers.map((windowNumber) => {
                const glasses = groupedByWindow[windowNumber];
                const firstGlass = glasses[0];
                const colors = getColorClasses(firstGlass.calculatorType);

                return (
                  <div
                    key={windowNumber}
                    className={`border-2 ${colors.border} ${colors.bg} rounded-xl p-6 shadow-md`}
                  >
                    <div className="mb-4">
                      <h3 className={`text-2xl font-bold ${colors.text}`}>
                        Ventana {windowNumber}
                      </h3>
                      <p className="text-lg font-semibold text-gray-700 mt-1">
                        {firstGlass.windowType}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {glasses.map((glass, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-[#003366] text-lg mb-1">
                                {glass.glassType === 'fija' ? 'VENTILA FIJA' : 'VENTILA CORREDIZA'}
                              </p>
                              <p className="text-gray-800 font-semibold">
                                {glass.pieces} pz de {glass.width} cm x {glass.height} cm
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="bg-gray-100 rounded-xl p-6 border-2 border-gray-300 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-[#003366]">TOTAL DE VIDRIOS:</span>
                  <span className="text-2xl font-bold text-[#003366]">{totalGlasses} piezas</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#004488] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
