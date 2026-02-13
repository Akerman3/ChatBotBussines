// src/components/DoorSubmenu.tsx
import React, { useState } from 'react';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { DoorFormulaGenerator } from './DoorFormulaGenerator';
import Waringoption from './Waringoption';

interface DoorSubmenuProps {
  onBack: () => void;
  onNavigateToCalculator: (
    option: 'quote' | 'work',
    line: 'L3' | 'L2',
    componentType: 'door' | 'window',
    windowType?: string,
    width?: string,
    height?: string
  ) => void;
}

function DoorIcon() {
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
      <rect x="4" y="4" width="12" height="16" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <circle cx="14" cy="12" r="1" />
    </svg>
  );
}

// New HelpModal Component with Tutorial Thumbnails for Doors
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
      imageUrl: '/assets/miniaturas/puertas/puerta.png',
      title: 'BOTON DE PUERTAS',
      videoUrl: 'https://www.youtube.com/watch?v=-F8v7111GBU&list=PL2CS-Ysr2M95vCJINdRh-J0LOyTwyeV_1&index=13',
    },
    {
      imageUrl: '/assets/miniaturas/puertas/generador-formula.png',
      title: 'BOTON GENERADOR DE FORMULA',
      videoUrl: 'https://www.youtube.com/playlist?list=PL2CS-Ysr2M94TZBE9viuRq4dOv5T8l6z2',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
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

export function DoorSubmenu({ onBack, onNavigateToCalculator }: DoorSubmenuProps) {
  const [showFormulaGenerator, setShowFormulaGenerator] = useState(false);
  const [showWarning, setShowWarning] =
    useState<null | 'SERIE50' | 'LINEA_ESPANOLA'>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 1) Prioridad: generador de fórmulas
  if (showFormulaGenerator) {
    return <DoorFormulaGenerator onBack={() => setShowFormulaGenerator(false)} />;
  }

  // 2) Segundo: pantalla de advertencia (no disponible)
  if (showWarning) {
    return (
      <Waringoption
        onBack={() => setShowWarning(null)}
        // Si algún día quieres personalizar el título:
        // title={showWarning === 'SERIE50' ? 'SERIE 50' : 'LÍNEA ESPAÑOLA'}
      />
    );
  }

  // 3) Menú principal de puertas
  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center px-4 animate-fade-in">
      <div className="w-full pt-6 px-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver al menú principal"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => {
            console.log('🔍 DoorSubmenu - Clic en Necesitas ayuda?');
            setShowHelpModal(true);
          }}
          className="bg-white text-[#003366] px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-md"
          aria-label="Necesitas ayuda"
        >
          ¿Necesitas ayuda?
        </button>
      </div>

      <div className="text-center my-8">
        <h1 className="text-white text-5xl font-bold">PUERTAS</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 w-full max-w-xl">
        {/* LÍNEA NACIONAL DE 3 -> calculadora de trabajo */}
        <button
          onClick={() => onNavigateToCalculator('work', 'L3', 'door')}
          className="flex flex-col items-center group"
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <DoorIcon />
          </div>
          <span className="text-white text-lg font-bold">LÍNEA NACIONAL DE 3</span>
        </button>

        {/* SERIE 50 -> pantalla "no disponible" */}
        <button
          onClick={() => setShowWarning('SERIE50')}
          className="flex flex-col items-center group"
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <DoorIcon />
          </div>
          <span className="text-white text-lg font-bold">SERIE 50</span>
        </button>

        {/* LÍNEA ESPAÑOLA -> pantalla "no disponible" */}
        <button
          onClick={() => setShowWarning('LINEA_ESPANOLA')}
          className="flex flex-col items-center group"
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <DoorIcon />
          </div>
          <span className="text-white text-lg font-bold">LÍNEA ESPAÑOLA</span>
        </button>

        {/* GENERADOR DE FÓRMULA */}
        <button
          onClick={() => setShowFormulaGenerator(true)}
          className="flex flex-col items-center group"
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 transition-transform group-hover:scale-105">
            <FlaskConical size={48} className="text-[#003366]" />
          </div>
          <span className="text-white text-lg font-bold">GENERADOR DE FÓRMULA</span>
        </button>
      </div>

      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}