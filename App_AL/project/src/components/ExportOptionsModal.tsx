import React from 'react';
import { X, Calculator, Ruler } from 'lucide-react';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  windowType: string;
  windowDimensions: {
    width: string;
    height: string;
  };
  onSelectOption: (
    option: 'quote' | 'work',
    line: 'L3' | 'L2'
  ) => void; 
}

export function ExportOptionsModal({
  isOpen,
  onClose,
  windowType,
  windowDimensions,
  onSelectOption
}: ExportOptionsModalProps) {
  if (!isOpen) return null;
  
  // Determinar si el tipo de ventana es compatible con Línea 2
  const isLine2Compatible = !(
    windowType === '2 Fijos 2 Corredizos' ||
    windowType === '4 Corredizas' ||
    windowType === 'Puerta' ||
    windowType === 'Vidrio'
  );

  // Determinar si es una puerta
  const isDoor = windowType === 'Puerta';
  
  // Determinar si es un vidrio
  const isGlass = windowType === 'Vidrio';
  
  // Verificar si se han ingresado las dimensiones
  const hasDimensions = windowDimensions.width.trim() !== '' && windowDimensions.height.trim() !== '';
  
  console.log('🔍 DEBUG: ExportOptionsModal - windowType recibido:', windowType);
  console.log('🔍 DEBUG: ExportOptionsModal - isLine2Compatible evaluado a:', isLine2Compatible);
  console.log('🔍 DEBUG: ExportOptionsModal - windowDimensions:', windowDimensions);
  console.log('🔍 DEBUG: ExportOptionsModal - isDoor:', isDoor);
  console.log('🔍 DEBUG: ExportOptionsModal - isGlass:', isGlass);
  console.log('🔍 DEBUG: ExportOptionsModal - hasDimensions:', hasDimensions);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-sm max-h-[90vh] overflow-y-auto mx-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003366]">Exportar Medidas</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} className="sm:size-[24px]" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="font-bold text-[#003366] mb-2 text-sm sm:text-base break-words">Ventana: {windowType}</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-white p-2 sm:p-3 rounded border border-blue-200">
                  <p className="text-xs text-gray-500">Ancho</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#003366] break-all">{windowDimensions.width} cm</p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded border border-blue-200">
                  <p className="text-xs text-gray-500">Alto</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#003366] break-all">{windowDimensions.height} cm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <p className="text-gray-700 font-medium text-sm sm:text-base">¿Qué deseas hacer con estas medidas?</p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-2 sm:px-3 py-2 border-b">
                  <h4 className="font-medium text-[#003366] text-sm sm:text-base">Cotizar</h4>
                </div>
                <div className="p-2 sm:p-3 space-y-2">
                  <button
                    onClick={() => onSelectOption('quote', 'L3')}
                    className="w-full flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs sm:text-sm md:text-base"
                   >
                    <div className="flex items-center">
                      <Calculator size={14} className="text-blue-600 mr-1 sm:mr-2 md:mr-3 sm:size-[16px] md:size-[20px]" />
                      <span className="font-medium text-xs sm:text-sm md:text-base">Línea Nacional de 3</span>
                    </div>
                    <span className="text-blue-600 text-sm sm:text-base">→</span>
                  </button>
                  
                  <button
                    disabled={!isLine2Compatible}
                    onClick={() => onSelectOption('quote', 'L2')}
                    className={`w-full flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3 rounded-lg transition-colors text-xs sm:text-sm md:text-base ${
                      isLine2Compatible 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'bg-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center">
                      <Calculator size={14} className="text-blue-600 mr-1 sm:mr-2 md:mr-3 sm:size-[16px] md:size-[20px]" />
                      <span className="font-medium text-xs sm:text-sm md:text-base">Línea Nacional de 2</span>
                    </div>
                    {isLine2Compatible ? (
                      <span className="text-blue-600 text-sm sm:text-base">→</span>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm">No disponible</span>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-2 sm:px-3 py-2 border-b">
                  <h4 className="font-medium text-[#003366] text-sm sm:text-base">Empezar a Trabajar</h4>
                </div>
                <div className="p-2 sm:p-3 space-y-2">
                  {isDoor || isGlass ? (
                    <button
                      onClick={() => onSelectOption(isGlass ? 'quote' : 'work', 'L3')}
                      disabled={!hasDimensions}
                      className={`w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                        hasDimensions 
                          ? 'bg-green-50 hover:bg-green-100' 
                          : 'bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center">
                        <Ruler size={14} className="text-green-600 mr-1 sm:mr-2 sm:size-[16px]" />
                        <span className="font-medium">{isGlass ? 'Cotizador General' : 'Línea Nacional de 3'}</span>
                      </div>
                      {hasDimensions ? (
                        <span className="text-green-600">→</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Ingrese medidas</span>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectOption('work', 'L3')}
                        className="w-full flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-xs sm:text-sm md:text-base"
                      >
                        <div className="flex items-center">
                          <Ruler size={14} className="text-green-600 mr-1 sm:mr-2 md:mr-3 sm:size-[16px] md:size-[20px]" />
                          <span className="font-medium text-xs sm:text-sm md:text-base">Línea Nacional de 3</span>
                        </div>
                        <span className="text-green-600 text-sm sm:text-base">→</span>
                      </button>
                      
                      <button
                        disabled={!isLine2Compatible}
                        onClick={() => onSelectOption('work', 'L2')}
                        className={`w-full flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3 rounded-lg transition-colors text-xs sm:text-sm md:text-base ${
                          isLine2Compatible 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'bg-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center">
                          <Ruler size={14} className="text-green-600 mr-1 sm:mr-2 md:mr-3 sm:size-[16px] md:size-[20px]" />
                          <span className="font-medium text-xs sm:text-sm md:text-base">Línea Nacional de 2</span>
                        </div>
                        {isLine2Compatible ? (
                          <span className="text-green-600 text-sm sm:text-base">→</span>
                        ) : (
                          <span className="text-gray-400 text-xs sm:text-sm">No disponible</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}