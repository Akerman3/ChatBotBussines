import React, { useState, useRef, useEffect } from 'react';

interface DoorComponentProps {
  doorWidth: string;
  doorHeight: string;
  fixedWidth: number;
  fixedHeight: number;
  onDoorWidthChange: (width: string) => void;
  onDoorHeightChange: (height: string) => void;
  onExport?: () => void;
  onSendToWork?: () => void;
}

interface AutoResizingInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function AutoResizingInput({ value, onChange, placeholder = "", className = "" }: AutoResizingInputProps) {
  const [inputHeight, setInputHeight] = useState(24); // Altura mínima
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height based on scrollHeight
      const newHeight = Math.max(24, textareaRef.current.scrollHeight);
      setInputHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        console.log('DoorComponent - Input value:', e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={`bg-white text-black text-center text-xs font-medium border border-black outline-none px-2 py-1 rounded resize-none overflow-hidden ${className}`}
      style={{ 
        width: '60px', // Ancho reducido para mejor visualización móvil
        height: `${inputHeight}px`,
        minHeight: '24px',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
      rows={1}
    />
  );
}

export function DoorComponent({ 
  doorWidth, 
  doorHeight, 
  fixedWidth,
  fixedHeight,
  onDoorWidthChange, 
  onDoorHeightChange,
  onExport,
  onSendToWork
}: DoorComponentProps) {
  // ✅ ESTADO PARA CONTROLAR LA DIRECCIÓN DE APERTURA
  const [openingDirection, setOpeningDirection] = useState<'right' | 'left'>('right');
  
  // ✅ NUEVO ESTADO PARA EL CAMPO XD/XF
  const [doorType, setDoorType] = useState<'XD' | 'XF'>('XD');

  // ✅ FUNCIÓN PARA MANEJAR EL DOBLE CLIC Y ALTERNAR DIRECCIÓN
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpeningDirection(prev => prev === 'right' ? 'left' : 'right');
  };

  // ✅ FUNCIÓN PARA MANEJAR EL DOBLE CLIC EN EL CAMPO XD/XF
  const handleDoorTypeDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDoorType(prev => prev === 'XD' ? 'XF' : 'XD');
  };

  return (
    <div
      className="relative"
      style={{
        width: fixedWidth,
        height: fixedHeight,
      }}
    >
      {/* ✅ CAMPO XD/XF ARRIBA DE LA PUERTA - PEGADO A LA LÍNEA AZUL */}
      <div 
        className="absolute top-[-2px] left-1/2 transform -translate-x-1/2 bg-white text-black text-center text-[10px] sm:text-xs font-bold border border-black px-1 py-0.5 sm:px-2 sm:py-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
        style={{ zIndex: 15 }}
        onDoubleClick={handleDoorTypeDoubleClick}
      >
        {doorType}
      </div>

      {/* Contenido de la puerta - ✅ AGREGADO onDoubleClick */}
      <div 
        className="w-full h-full bg-white border-2 border-[#003366] rounded relative cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        {/* Puerta realista */}
        <div className="absolute inset-1 bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-800 rounded-sm">
          {/* Marco interior */}
          <div className="absolute inset-1 border border-amber-700 rounded-sm">
            {/* Panel superior */}
            <div className="absolute top-1 left-1 right-1 h-[45%] bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-600 rounded-sm"></div>
            
            {/* Panel inferior */}
            <div className="absolute bottom-1 left-1 right-1 h-[45%] bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-600 rounded-sm"></div>
            
            {/* ✅ MANIJA DE LA PUERTA - POSICIÓN BASADA EN openingDirection */}
            <div className={`absolute ${openingDirection === 'right' ? 'right-2' : 'left-2'} top-1/2 transform -translate-y-1/2`}>
              <div className="w-1.5 h-3 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full shadow-sm border border-yellow-800"></div>
            </div>
            
            {/* ✅ BISAGRAS MEJORADAS - MÁS GRANDES Y VISIBLES */}
            <div className={`absolute ${openingDirection === 'right' ? 'left-0' : 'right-0'} top-2`}>
              <div className="w-2 h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-sm shadow-md border border-gray-900"></div>
            </div>
            <div className={`absolute ${openingDirection === 'right' ? 'left-0' : 'right-0'} bottom-2`}>
              <div className="w-2 h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-sm shadow-md border border-gray-900"></div>
            </div>

            {/* ✅ ÓVALO CAFÉ - POSICIÓN BASADA EN openingDirection */}
            <div className={`absolute ${openingDirection === 'right' ? 'right-1' : 'left-1'} top-1/2 transform -translate-y-1/2`}>
              <div className="w-2 h-4 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full shadow-sm border border-yellow-800"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Campo de ANCHO (abajo) - Más alejado hacia afuera */}
      <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2" style={{ zIndex: 10 }}>
        <AutoResizingInput
          value={doorWidth}
          onChange={(value) => {
            console.log('DoorComponent - Width changed to:', value);
            onDoorWidthChange(value);
          }}
          placeholder="Ancho"
          className="text-[10px] sm:text-xs"
        />
      </div>

      {/* Campo de ALTO (izquierda) - MOVIDO UN POCO MÁS ARRIBA */}
      <div className="absolute left-[-45px] sm:left-[-65px] top-[60%] transform -translate-y-1/2" style={{ zIndex: 10 }}>
        <AutoResizingInput
          value={doorHeight}
          onChange={(value) => {
            console.log('DoorComponent - Height changed to:', value);
            onDoorHeightChange(value);
          }}
          placeholder="Alto"
          className="text-[10px] sm:text-xs"
        />
      </div>
      
      {/* Botón de exportar */}
      {onExport && doorWidth && doorHeight && (
        <button
          onClick={() => {
            console.log('DoorComponent - Export button clicked with width:', doorWidth, 'height:', doorHeight);
            onExport();
          }}
          className="absolute -top-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg z-[60] transition-colors duration-200 cursor-pointer"
          title="Exportar medidas"
        >
          <svg width="10" height="10" className="sm:w-[12px] sm:h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
        </button>
      )}
      
      {/* Botón de mandar a trabajar */}
      {onSendToWork && doorWidth && doorHeight && (
        <button
          onClick={onSendToWork}
          className="absolute -top-2 left-6 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg z-[60] transition-colors duration-200 cursor-pointer"
          title="Mandar a trabajar"
        >
          <svg width="10" height="10" className="sm:w-[12px] sm:h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      )}
    </div>
  );
}