import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, ChevronDown, ChevronUp, RotateCcw, Save, FolderOpen, Eye } from 'lucide-react';
import { SavePiecePackageModal } from './SavePiecePackageModal';
import { SavedPiecePackagesModal } from './SavedPiecePackagesModal';
import { GlassPackageModal, GlassInfo } from './GlassPackageModal';

interface ProfilePiece {
  type: string;
  measure: string;
  pieces: number;
  windowType: string;
  zocloType?: 'upper' | 'lower';
  zocloProfile?: string;
}

interface TroquelCalculatorProps {
  onBack: () => void;
}

export function TroquelCalculator({ onBack }: TroquelCalculatorProps) {
  const [pieces, setPieces] = useState<ProfilePiece[]>([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [glassData, setGlassData] = useState<GlassInfo[]>([]);

  useEffect(() => {
    const savedPieces = localStorage.getItem('packagePieces');
    if (savedPieces) {
      setPieces(JSON.parse(savedPieces));
    }
    loadGlassData();
  }, []);

  const loadGlassData = () => {
    try {
      const savedGlasses = localStorage.getItem('packageGlasses');
      if (savedGlasses) {
        setGlassData(JSON.parse(savedGlasses));
      }
    } catch (error) {
      console.error('Error loading glass data:', error);
      setGlassData([]);
    }
  };

  // Get unique window numbers
  const windowNumbers = [...new Set(pieces.map(piece => {
    const match = piece.windowType.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }))].filter((num): num is number => num !== null).sort((a, b) => a - b);

  // Agrupar piezas por tipo
  const groupedByType = pieces.reduce((acc, piece) => {
    if (!acc[piece.type]) {
      acc[piece.type] = [];
    }
    acc[piece.type].push(piece);
    return acc;
  }, {} as Record<string, ProfilePiece[]>);

  // Ordenar cada grupo por medida (de mayor a menor), excepto ZOCLO que se ordena por tipo primero
  Object.values(groupedByType).forEach(group => {
    if (group.length > 0 && group[0].type === 'ZOCLO') {
      // Para ZOCLO: ordenar primero por tipo de zócalo, luego por medida
      const zocloOrder = ['ZOCLO 1V', 'ZOCLO 2V', 'CABEZAL'];
      group.sort((a, b) => {
        const aProfile = a.zocloProfile || '';
        const bProfile = b.zocloProfile || '';
        const aIndex = zocloOrder.indexOf(aProfile);
        const bIndex = zocloOrder.indexOf(bProfile);
        
        // Si son del mismo tipo de zócalo, ordenar por medida (mayor a menor)
        if (aProfile === bProfile) {
          return parseFloat(b.measure) - parseFloat(a.measure);
        }
        
        // Si son tipos diferentes, ordenar por el orden definido
        return aIndex - bIndex;
      });
    } else {
      // Para otros tipos: ordenar solo por medida (mayor a menor)
      group.sort((a, b) => parseFloat(b.measure) - parseFloat(a.measure));
    }
  });

  // Orden específico de los tipos de perfiles
  const profileOrder = ['JAMBA', 'RIEL', 'RIEL ADICIONAL', 'CERCO', 'TRASLAPE', 'ZOCLO'];

  // Crear lista plana de pasos ordenados
  const workflowSteps = profileOrder.flatMap(type => {
    const typePieces = groupedByType[type] || [];
    // No aplicar ordenamiento adicional aquí - mantener el orden ya establecido
    return typePieces;
  });

  const handleDeleteAll = () => {
    if (confirm('¿Estás seguro que deseas eliminar todas las piezas? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('packagePieces');
      localStorage.removeItem('packageGlasses');
      setPieces([]);
      setGlassData([]);
    }
  };

  const handleDeleteWindow = (windowNumber: number) => {
    if (confirm(`¿Estás seguro que deseas eliminar la Ventana ${windowNumber}? Esta acción no se puede deshacer.`)) {
      const newPieces = pieces.filter(piece => !piece.windowType.includes(`Ventana ${windowNumber}`));
      const newGlasses = glassData.filter(glass => glass.windowNumber !== windowNumber);
      localStorage.setItem('packagePieces', JSON.stringify(newPieces));
      localStorage.setItem('packageGlasses', JSON.stringify(newGlasses));
      setPieces(newPieces);
      setGlassData(newGlasses);
      setShowDeleteMenu(false);
    }
  };

  const handleNext = () => {
    const currentPiece = workflowSteps[currentStep];
    if (currentPieceIndex < currentPiece.pieces - 1) {
      setCurrentPieceIndex(prev => prev + 1);
    } else if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setCurrentPieceIndex(0);
    } else {
      setShowWorkflow(false);
      setCurrentStep(0);
      setCurrentPieceIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentPieceIndex > 0) {
      setCurrentPieceIndex(prev => prev - 1);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      const previousPiece = workflowSteps[currentStep - 1];
      setCurrentPieceIndex(previousPiece.pieces - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCurrentPieceIndex(0);
  };

  const handleSavePackage = (name: string) => {
    const packageData = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      pieces,
      glasses: glassData,
      totalPieces: pieces.reduce((sum, piece) => sum + piece.pieces, 0),
      profileTypes: [...new Set(pieces.map(piece => piece.type))]
    };

    const savedPackages = JSON.parse(localStorage.getItem('savedPiecePackages') || '[]');
    savedPackages.push(packageData);
    localStorage.setItem('savedPiecePackages', JSON.stringify(savedPackages));

    setShowSaveModal(false);
    alert('¡Paquete de piezas guardado exitosamente!');
  };

  const handleLoadPackage = (packageData: any) => {
    localStorage.setItem('packagePieces', JSON.stringify(packageData.pieces));
    setPieces(packageData.pieces);

    if (packageData.glasses) {
      localStorage.setItem('packageGlasses', JSON.stringify(packageData.glasses));
      setGlassData(packageData.glasses);
    } else {
      localStorage.removeItem('packageGlasses');
      setGlassData([]);
    }

    setShowLoadModal(false);
    alert(`Paquete "${packageData.name}" cargado exitosamente!`);
  };

  if (showWorkflow) {
    const currentPiece = workflowSteps[currentStep];
    const isLastPiece = currentPieceIndex === currentPiece.pieces - 1;
    const isLastStep = currentStep === workflowSteps.length - 1 && isLastPiece;
    const isFirstStep = currentStep === 0 && currentPieceIndex === 0;

    return (
      <div className="min-h-screen bg-[#003366] flex flex-col items-center px-4 animate-fade-in">
        <div className="w-full pt-6 px-6 flex justify-between items-center">
          <button
            onClick={() => setShowWorkflow(false)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onClick={handleRestart}
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
            aria-label="Reiniciar proceso"
          >
            <RotateCcw size={24} />
            <span>Reiniciar</span>
          </button>
        </div>

        <div className="text-center my-8">
          <h1 className="text-white text-5xl font-bold">CORTE DE PERFILES</h1>
          <p className="text-gray-300 text-xl mt-4">
            Pieza {currentPieceIndex + 1} de {currentPiece.pieces}
          </p>
        </div>

        <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-lg">
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg py-3 px-4 mb-4">
                <span className="text-[#003366] text-4xl font-bold">
                  {currentPiece.windowType}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-[#003366]">{currentPiece.type}</h2>
              {currentPiece.type === 'ZOCLO' && currentPiece.zocloProfile && (
                <p className="text-lg text-blue-600 mt-2">
                  {currentPiece.zocloProfile} - {currentPiece.zocloType === 'upper' ? 'Superior' : 'Inferior'}
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-[#003366]">
                1 pz {currentPiece.measure} cm
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                disabled={isFirstStep}
                className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 ${
                  isFirstStep 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#003366] text-white hover:bg-blue-800 transition-colors'
                }`}
              >
                ANTERIOR
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-[#003366] text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors"
              >
                {isLastStep ? 'FINALIZAR' : 'SIGUIENTE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center px-4 animate-fade-in">
      <div className="w-full pt-6 px-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver al menú anterior"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLoadModal(true)}
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-1 text-sm"
          >
            <FolderOpen size={16} />
            <span className="hidden sm:inline">Cargar</span>
          </button>
          {pieces.length > 0 && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 text-sm"
            >
              <Save size={16} />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-center my-8">
        <h1 className="text-white text-5xl font-bold">PAQUETE DE VENTANAS</h1>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-lg p-6 mb-8">
        {glassData.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowGlassModal(true)}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-bold border-2 border-green-300 shadow-md"
            >
              <Eye size={20} />
              <span>VIDRIOS CONTEMPLADOS</span>
            </button>
          </div>
        )}


        {profileOrder.map(profileType => {
          const profilePieces = groupedByType[profileType] || [];
          if (profilePieces.length === 0) return null;

          return (
            <div key={profileType} className="mb-8">
              <h2 className="text-xl font-bold text-[#003366] mb-4">{profileType}</h2>
              <div className="space-y-4">
                {profilePieces.map((piece, index) => (
                  <div key={`${piece.windowType}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-medium text-[#003366]">{piece.measure} cm</p>
                        <p className="text-sm text-gray-500">{piece.windowType}</p>
                        {piece.type === 'ZOCLO' && piece.zocloProfile && (
                          <p className="text-sm text-blue-600">
                            {piece.zocloProfile} - {piece.zocloType === 'upper' ? 'Superior' : 'Inferior'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#003366]">{piece.pieces} piezas</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#003366]">Total de piezas:</span>
                    <span className="font-bold text-[#003366]">
                      {profilePieces.reduce((sum, piece) => sum + piece.pieces, 0)} piezas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {pieces.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No hay piezas registradas
          </div>
        )}

        {pieces.length > 0 && (
          <div className="mt-8 space-y-4">
            <button
              onClick={() => setShowWorkflow(true)}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
            >
              EMPEZAR A TRABAJAR
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className="w-full bg-red-100 text-red-600 py-3 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={20} />
                BORRAR VENTANA
                {showDeleteMenu ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showDeleteMenu && (
                <div className="absolute inset-x-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-10">
                  <div className="p-2">
                    {windowNumbers.map((number) => (
                      <button
                        key={number}
                        onClick={() => handleDeleteWindow(number)}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                      >
                        Ventana {number}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleDeleteAll}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              BORRAR TODO
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
      {showSaveModal && (
        <SavePiecePackageModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSavePackage}
        />
      )}

      {showLoadModal && (
        <SavedPiecePackagesModal
          onClose={() => setShowLoadModal(false)}
          onLoadPackage={handleLoadPackage}
        />
      )}

      {showGlassModal && (
        <GlassPackageModal
          onClose={() => setShowGlassModal(false)}
          glassData={glassData}
        />
      )}
    </div>
  );
}