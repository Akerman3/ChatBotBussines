import React, { useState, useRef, useEffect } from 'react';

interface DoubleSlidingWindowComponentProps {
  fixedWidth: number;
  fixedHeight: number;
  windowWidth: string;
  windowHeight: string;
  onWindowWidthChange: (width: string) => void;
  onWindowHeightChange: (height: string) => void;
  onExport?: () => void;
}

interface AutoResizingInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function AutoResizingInput({ value, onChange, placeholder = "", className = "" }: AutoResizingInputProps) {
  const [inputHeight, setInputHeight] = useState(24);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(24, textareaRef.current.scrollHeight);
      setInputHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white text-black text-center text-xs font-medium border border-black outline-none px-2 py-1 rounded resize-none overflow-hidden ${className}`}
      style={{ 
        width: '60px', 
        height: `${inputHeight}px`,
        minHeight: '24px',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
    />
  );
}

export function DoubleSlidingWindowComponent({ 
  fixedWidth, 
  fixedHeight,
  windowWidth,
  windowHeight,
  onWindowWidthChange,
  onWindowHeightChange,
  onExport
}: DoubleSlidingWindowComponentProps) {
  // Estado para cada panel individual
  const [showArrowLeft, setShowArrowLeft] = useState(false);
  const [showArrowRight, setShowArrowRight] = useState(false);

  const handleDoubleClickLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowArrowLeft(!showArrowLeft);
  };

  const handleDoubleClickRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowArrowRight(!showArrowRight);
  };

  return (
    <div className="relative" style={{ width: fixedWidth, height: fixedHeight }}>
      {/* Marco exterior único */}
      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-[#003366] rounded">
        
        {/* División central vertical */}
        <div className="absolute left-1/2 top-1 bottom-1 w-0.5 bg-amber-700 transform -translate-x-1/2"></div>
        
        {/* Panel CORREDIZO izquierdo - DOBLE CLICK INDIVIDUAL */}
        <div 
          className="absolute left-1 top-1 w-[calc(50%-2px)] h-[calc(100%-8px)] bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-600 rounded-sm cursor-pointer"
          onDoubleClick={handleDoubleClickLeft}
        >
          {/* Manija del panel izquierdo */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
            <div className="w-1.5 h-3 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full shadow-sm border border-yellow-800"></div>
          </div>

          {/* FLECHA MÁS GRANDE - PANEL IZQUIERDO APUNTA A LA DERECHA → */}
          {showArrowLeft && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          )}
        </div>
        
        {/* Panel CORREDIZO derecho - DOBLE CLICK INDIVIDUAL */}
        <div 
          className="absolute right-1 top-1 w-[calc(50%-2px)] h-[calc(100%-8px)] bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-600 rounded-sm cursor-pointer"
          onDoubleClick={handleDoubleClickRight}
        >
          {/* Manija del panel derecho */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-1.5 h-3 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full shadow-sm border border-yellow-800"></div>
          </div>

          {/* FLECHA MÁS GRANDE - PANEL DERECHO APUNTA A LA IZQUIERDA ← */}
          {showArrowRight && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Campo de ANCHO (abajo) */}
      <div className="absolute bottom-[-25px] sm:bottom-[-40px] left-1/2 transform -translate-x-1/2" style={{ zIndex: 10 }}>
        <AutoResizingInput
          value={windowWidth}
          onChange={onWindowWidthChange}
          placeholder="Ancho"
          className="text-[10px] sm:text-xs"
        />
      </div>

      {/* Campo de ALTO (izquierda) */}
      <div className="absolute left-[-45px] sm:left-[-65px] top-[70%] transform -translate-y-1/2" style={{ zIndex: 10 }}>
        <AutoResizingInput
          value={windowHeight}
          onChange={onWindowHeightChange}
          placeholder="Alto"
          className="text-[10px] sm:text-xs"
        />
      </div>
      
      {/* Botón de exportar */}
      {onExport && windowWidth && windowHeight && (
        <button
          onClick={onExport}
          className="absolute -top-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg z-[60] transition-colors duration-200 cursor-pointer"
          title="Exportar medidas"
        >
          <svg width="10" height="10" className="sm:w-[12px] sm:h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
        </button>
      )}
    </div>
  );
}