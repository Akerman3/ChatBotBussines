import React, { useState } from 'react';
import WindowCalculator from './WindowCalculator';
import { WindowCalculatorLine2 } from './WindowCalculatorLine2';
import { TwoFixedTwoSlidingCalculator } from './TwoFixedTwoSlidingCalculator';
import { FourSlidingCalculator } from './FourSlidingCalculator';
import { ArrowLeft, Package2, FlaskConical } from 'lucide-react';
import { PackagePieces } from './PackagePieces';
import { XXCalculator } from './XXCalculator';
import { TroquelCalculator } from './TroquelCalculator';
import { FormulaGenerator } from './FormulaGenerator';

type WindowType = {
  id: string;
  title: string;
  panels: number;
  type: string;
};

const windowTypes: Record<string, WindowType[]> = {
  'LÍNEA NACIONAL DE 3': [
    { id: 'fc', title: 'Fijo Corredizo', panels: 2, type: 'fixed-sliding' },
    { id: 'xx', title: 'Doble Corrediza', panels: 2, type: 'xx' },
    { id: 'fccf', title: '2 Fijos y 2 Corredizos', panels: 4, type: 'fixed-sliding-sliding-fixed' },
    { id: 'cccc', title: '4 Corredizas', panels: 4, type: 'sliding-all' },
  ],
  'LÍNEA NACIONAL DE 2': [
    { id: 'fc-2', title: 'Fijo y Corredizo', panels: 2, type: 'fixed-sliding' },
    { id: 'cc-2', title: 'Doble Corrediza', panels: 2, type: 'sliding-sliding' },
  ],
};

interface WindowButtonProps {
  type: WindowType;
  onClick: (type: WindowType) => void;
}

export function WindowButton({ type, onClick }: WindowButtonProps) {
  return (
    <button
      onClick={() => onClick(type)}
      className="group flex flex-col items-center mb-6 transition-transform hover:scale-105"
      aria-label={`Seleccionar ventana tipo ${type.title}`}
    >
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
        <WindowIcon type={type} />
      </div>
      <span className="text-white text-lg font-bold mt-2">{type.title}</span>
    </button>
  );
}

function WindowIcon({ type }: { type: WindowType }) {
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
      {type.panels === 2 && (
        <line x1="12" y1="4" x2="12" y2="20" />
      )}
      {type.panels === 4 && (
        <>
          <line x1="8" y1="4" x2="8" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="16" y1="4" x2="16" y2="20" />
        </>
      )}
    </svg>
  );
}

// New HelpModal Component with Tutorial Thumbnails
interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

interface TutorialButtonProps {
  imageUrl: string;
  title: string;
  videoUrl: string;
}

function TutorialButton({ imageUrl, title, videoUrl }: TutorialButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => {
      window.open(videoUrl, '_blank');
      setIsPressed(false);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      {/* Thumbnail Image - Clickable */}
      <div
        onClick={handleClick}
        className={`cursor-pointer transition-transform ${
          isPressed ? 'scale-95' : 'hover:scale-105'
        }`}
        style={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {/* Button */}
      <button
        onClick={handleClick}
        className={`transition-all ${isPressed ? 'scale-95' : ''}`}
        style={{
          lineHeight: 1,
          backgroundColor: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35em',
          padding: '0.75em 1.5em',
          color: '#fff',
          border: '1px solid transparent',
          fontWeight: 700,
          borderRadius: '2em',
          fontSize: '1rem',
          boxShadow: '0 0.7em 1.5em -0.5em rgba(0, 255, 17, 0.745)',
          background: 'linear-gradient(90deg, #00FF11 0%, #00FF11 100%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#f4f5f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        <span>{title}</span>
      </button>
    </div>
  );
}

function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  const tutorials = [
    {
      imageUrl: '/assets/miniaturas/ventanas/ventana.png',
      title: 'BOTON VENTANAS',
      videoUrl: 'https://youtube.com/playlist?list=PL2CS-Ysr2M9688ysmFLcHZkAFVhA8qKa_&si=j6dWtx0aIU75NGaH',
    },
    {
      imageUrl: '/assets/miniaturas/ventanas/paquete-ventnas.png',
      title: 'BOTON PAQUETE DE VENTANAS',
      videoUrl: 'https://youtu.be/Noe5AG75Z0c?si=8pUFjQRIs3hiN8Hy',
    },
    {
      imageUrl: '/assets/miniaturas/ventanas/creador-formula.png',
      title: 'BOTON GENERADOR DE FORMULAS',
      videoUrl: 'https://youtube.com/playlist?list=PL2CS-Ysr2M94TZBE9viuRq4dOv5T8l6z2&si=0GjMugQCyf0BnsqT',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 p-4"
      onClick={onClose}
      style={{
        alignItems: 'flex-start',
        paddingTop: '20px',
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center rounded-t-3xl z-10">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Cerrar"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 ml-4">Tutoriales de ayuda</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {tutorials.map((tutorial, index) => (
            <TutorialButton
              key={index}
              imageUrl={tutorial.imageUrl}
              title={tutorial.title}
              videoUrl={tutorial.videoUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface WindowSubmenuProps {
  onClose: () => void;
  onNavigateToCalculator: (
    option: 'quote' | 'work',
    line: 'L3' | 'L2',
    componentType: 'door' | 'window', 
    windowType?: string,
    width?: string, 
    height?: string
  ) => void;
}

export function WindowSubmenu({ onClose, onNavigateToCalculator }: WindowSubmenuProps) {
  const [showPackagePieces, setShowPackagePieces] = useState(false);
  const [showTroquelCalculator, setShowTroquelCalculator] = useState(false);
  const [showFormulaGenerator, setShowFormulaGenerator] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleWindowSelect = (type: WindowType) => {
    // Map window types to calculator screens
    if (type.id === 'fc') {
      onNavigateToCalculator('work', 'L3', 'window', 'fixed-sliding-window');
    } else if (type.id === 'xx') {
      onNavigateToCalculator('work', 'L3', 'window', 'double-sliding-window');
    } else if (type.id === 'fccf') {
      onNavigateToCalculator('work', 'L3', 'window', 'two-fixed-two-sliding-window');
    } else if (type.id === 'cccc') {
      onNavigateToCalculator('work', 'L3', 'window', 'four-sliding-window');
    } else if (type.id === 'fc-2') {
      onNavigateToCalculator('work', 'L2', 'window', 'fixed-sliding-window');
    } else if (type.id === 'cc-2') {
      onNavigateToCalculator('work', 'L2', 'window', 'double-sliding-window');
    }
  };

  if (showPackagePieces) {
    return <PackagePieces onBack={() => setShowPackagePieces(false)} />;
  }

  if (showTroquelCalculator) {
    return <TroquelCalculator onBack={() => setShowTroquelCalculator(false)} />;
  }

  if (showFormulaGenerator) {
    return <FormulaGenerator onBack={() => setShowFormulaGenerator(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center px-4 animate-fade-in">
      <div className="w-full pt-6 px-6 flex justify-between items-center">
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver al menú principal"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => {
            console.log('🔍 WindowSubmenu - Clic en Necesitas ayuda?');
            setShowHelpModal(true);
          }}
          className="bg-white text-[#003366] px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-md"
          aria-label="Necesitas ayuda"
        >
          ¿Necesitas ayuda?
        </button>
      </div>

      <div className="text-center my-8">
        <h1 className="text-white text-5xl font-bold">VENTANAS</h1>
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full mt-4">
          <span className="font-bold">LÍNEA NACIONAL DE 3</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {windowTypes['LÍNEA NACIONAL DE 3'].map((type) => (
          <WindowButton key={type.id} type={type} onClick={handleWindowSelect} />
        ))}
      </div>

      <div className="text-center mt-12">
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">LÍNEA NACIONAL DE 2</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-8">
        {windowTypes['LÍNEA NACIONAL DE 2'].map((type) => (
          <WindowButton key={type.id} type={type} onClick={handleWindowSelect} />
        ))}
      </div>

      <div className="text-center mt-12">
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">LISTA DE TRABAJO</span>
        </div>
      </div>

      <div className="flex items-center justify-center mt-8">
        <button 
          className="group flex flex-col items-center transition-transform hover:scale-105"
          onClick={() => setShowTroquelCalculator(true)}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Package2 size={48} className="text-[#003366]" />
          </div>
          <span className="text-white text-lg font-bold mt-2">Paquete de Ventanas</span>
        </button>
      </div>

      <div className="text-center mt-12">
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">CREADOR DE FÓRMULA</span>
        </div>
      </div>

      <div className="flex items-center justify-center mt-8">
        <button 
          className="group flex flex-col items-center transition-transform hover:scale-105"
          onClick={() => setShowFormulaGenerator(true)}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
            <FlaskConical size={48} className="text-[#003366]" />
          </div>
          <span className="text-white text-lg font-bold mt-2">GENERADOR DE FÓRMULA</span>
        </button>
      </div>

      <div className="text-center mt-12 mb-8">
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">SERIE 50 ...</span>
        </div>
        <p className="text-white text-lg mt-4 font-medium">Próximamente</p>
      </div>

      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}