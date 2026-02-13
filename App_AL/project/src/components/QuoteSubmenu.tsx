import React, { useState } from 'react';
import { ArrowLeft, DollarSign, FileText } from 'lucide-react';

interface QuoteSubmenuProps {
  onBack: () => void;
  onNavigateToScreen: (screen: string) => void;
}

// New HelpModal Component with Tutorial Thumbnails for Quote
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
      imageUrl: '/assets/miniaturas/cotizacion/base-datos.png',
      title: 'BOTON DE BASE DE DATOS',
      videoUrl: 'https://www.youtube.com/playlist?list=PL2CS-Ysr2M97iu0pj51u6H5nYwndx77wZ',
    },
    {
      imageUrl: '/assets/miniaturas/cotizacion/cotizador-general.png',
      title: 'BOTON COTIZADOR GENERAL',
      videoUrl: 'https://www.youtube.com/playlist?list=PL2CS-Ysr2M97eeDY2WksFY-qdxF07EqJ2',
    },
    {
      imageUrl: '/assets/miniaturas/cotizacion/cotiza-ventana.png',
      title: 'BOTON DE COTIZA VENTANAS',
      videoUrl: 'https://www.youtube.com/playlist?list=PL2CS-Ysr2M97zwohLBN5QfL8k2ft7t0_d',
    },
    {
      imageUrl: '/assets/miniaturas/cotizacion/hoja-cotizacion.png',
      title: 'BOTON HOJA DE COTIZACION',
      videoUrl: 'https://www.youtube.com/watch?v=qiYUE8GLeps&list=PL2CS-Ysr2M95vCJINdRh-J0LOyTwyeV_1&index=24',
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

export function QuoteSubmenu({ onBack, onNavigateToScreen }: QuoteSubmenuProps) {
  console.log('🔍 QuoteSubmenu - Componente renderizado. Props:', { onBack, onNavigateToScreen });
  const [showHelpModal, setShowHelpModal] = useState(false);

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
            console.log('🔍 QuoteSubmenu - Clic en Necesitas ayuda?');
            setShowHelpModal(true);
          }}
          className="bg-white text-[#003366] px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-md"
          aria-label="Necesitas ayuda"
        >
          ¿Necesitas ayuda?
        </button>
      </div>

      <div className="text-center my-8">
        <h1 className="text-white text-5xl font-bold mb-4">COTIZADOR</h1>
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full">
          <span className="font-bold">VENTANAS LINEA DE 3</span>
        </div>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-2 gap-6 mt-12 px-4">
        <button 
          className="group flex flex-col items-center transition-transform hover:scale-105"
          onClick={() => {
            console.log('🔍 QuoteSubmenu - Clic en BASE DE DATOS. Navegando a priceDatabase.');
            onNavigateToScreen('priceDatabase');
          }}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <span className="text-[#003366] text-3xl font-bold">$</span>
          </div>
          <span className="text-white text-xl font-bold">BASE DE DATOS</span>
        </button>

        <button
          className="group flex flex-col items-center transition-transform hover:scale-105"
          onClick={() => {
            console.log('🔍 QuoteSubmenu - Clic en COTIZADOR GENERAL. Navegando a generalQuote.');
            onNavigateToScreen('generalQuote');
          }}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <DollarSign size={28} className="text-[#003366]" />
          </div>
          <span className="text-white text-xl font-bold">COTIZADOR GENERAL</span>
        </button>

        <button
          className="group flex flex-col items-center transition-transform hover:scale-105"
          onClick={() => {
            console.log('🔍 QuoteSubmenu - Clic en COTIZA VENTANAS. Navegando a windowQuote.');
            onNavigateToScreen('windowQuote');
          }}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#003366"
              strokeWidth="1.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <rect x="4" y="4" width="16" height="16" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold">COTIZA VENTANAS</span>
        </button>

        <button
          className="group flex flex-col items-center transition-transform hover:scale-105 cursor-pointer"
          onClick={() => {
            console.log('🔍 QuoteSubmenu - Clic en HOJA DE COTIZACIÓN. Navegando a quoteSheetHome.');
            onNavigateToScreen('quoteSheetHome');
          }}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <FileText size={28} className="text-[#003366]" />
          </div>
          <span className="text-white text-xl font-bold">HOJA DE COTIZACIÓN</span>
        </button>
      </div>

      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}