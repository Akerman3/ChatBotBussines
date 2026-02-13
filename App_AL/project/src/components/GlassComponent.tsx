import React, { useState, useRef, useEffect } from 'react';

interface GlassComponentProps {
  glassWidth: string;
  glassHeight: string;
  fixedWidth: number;
  fixedHeight: number;
  onGlassWidthChange: (width: string) => void;
  onGlassHeightChange: (height: string) => void;
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
      onChange={(e) => {
        console.log('GlassComponent - Input value:', e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={`bg-white text-black text-center text-xs font-medium border border-black outline-none px-2 py-1 rounded resize-none overflow-hidden ${className}`}
      style={{ 
        width: '60px',
        height: `${inputHeight}px`,
        minHeight: '24px',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
      rows={1}
    />
  );
}

export function GlassComponent({ 
  glassWidth, 
  glassHeight, 
  fixedWidth,
  fixedHeight,
  onGlassWidthChange, 
  onGlassHeightChange
}: GlassComponentProps) {
  // Determinar la forma del vidrio basada en las medidas
  const determineGlassShape = () => {
    const width = parseFloat(glassWidth) || 0;
    const height = parseFloat(glassHeight) || 0;
    
    if (width === 0 || height === 0) {
      return 'square'; // Por defecto mostrar cuadrado
    }
    
    const difference = Math.abs(width - height);
    
    if (difference <= 3) {
      return 'square';
    } else if (width > height) {
      return 'horizontal'; // Rectángulo acostado
    } else {
      return 'vertical'; // Rectángulo parado
    }
  };

  const glassShape = determineGlassShape();

  // Definir dimensiones visuales fijas para cada forma
  const getGlassVisualDimensions = () => {
    switch (glassShape) {
      case 'square':
        return { width: 50, height: 50 };
      case 'horizontal':
        return { width: 70, height: 40 };
      case 'vertical':
        return { width: 40, height: 70 };
      default:
        return { width: 50, height: 50 };
    }
  };

  const visualDimensions = getGlassVisualDimensions();

  return (
    <div
      className="relative"
      style={{
        width: fixedWidth,
        height: fixedHeight,
      }}
    >
      {/* Contenedor del vidrio centrado */}
      <div className="w-full h-full flex items-center justify-center">
        <div 
          className="bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-600 rounded-sm shadow-lg relative"
          style={{
            width: `${visualDimensions.width}px`,
            height: `${visualDimensions.height}px`,
          }}
        >
          {/* Efecto de vidrio con líneas diagonales sutiles */}
          <div className="absolute inset-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-sm opacity-80">
            {/* Líneas diagonales para simular reflejo de vidrio */}
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-white opacity-60 transform rotate-45"></div>
            <div className="absolute top-2 left-3 w-2 h-0.5 bg-white opacity-40 transform rotate-45"></div>
            <div className="absolute bottom-2 right-2 w-2 h-0.5 bg-blue-300 opacity-60 transform rotate-45"></div>
          </div>
          
          {/* Etiqueta de vidrio */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-blue-800 font-bold text-xs">VIDRIO</span>
          </div>
        </div>
      </div>

      {/* Campo de ANCHO (abajo) */}
      <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2" style={{ zIndex: 10 }}>
        <AutoResizingInput
          value={glassWidth}
          onChange={(value) => {
            console.log('GlassComponent - Width changed to:', value);
            onGlassWidthChange(value);
          }}
          placeholder="Ancho"
          className="text-[10px] sm:text-xs"
        />
      </div>

      {/* Campo de ALTO (izquierda) */}
      <div className="absolute left-[-45px] sm:left-[-65px] top-[60%] transform -translate-y-1/2" style={{ zIndex: 10 }}>
        <AutoResizingInput
          value={glassHeight}
          onChange={(value) => {
            console.log('GlassComponent - Height changed to:', value);
            onGlassHeightChange(value);
          }}
          placeholder="Alto"
          className="text-[10px] sm:text-xs"
        />
      </div>
    </div>
  );
}