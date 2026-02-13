import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight, RotateCcw, Save, FolderOpen, Package } from 'lucide-react';
import { SaveFormulaPiecePackageModal } from './SaveFormulaPiecePackageModal';
import { SavedFormulaPiecePackagesModal } from './SavedFormulaPiecePackagesModal';
import { FormulaCuttingWorkflow } from './FormulaCuttingWorkflow';
import { normalizeProfileName } from '../utils/profileUtils';

interface ProfilePiece {
  type: string;
  measure: string;
  pieces: number;
  windowType: string;
  insertionOrder?: number;
}

interface FormulaPackagePiecesProps {
  onBack: () => void;
}

export function FormulaPackagePieces({ onBack }: FormulaPackagePiecesProps) {
  const [pieces, setPieces] = useState<ProfilePiece[]>(() => 
    JSON.parse(localStorage.getItem('formulaGeneratorPackagePieces') || '[]')
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Persist pieces to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('formulaGeneratorPackagePieces', JSON.stringify(pieces));
  }, [pieces]);

  // Agrupar piezas por tipo usando normalización
  const groupedPieces = pieces.reduce((acc, piece) => {
    const normalizedType = normalizeProfileName(piece.type);
    if (!acc[normalizedType]) {
      acc[normalizedType] = [];
    }
    acc[normalizedType].push(piece);
    return acc;
  }, {} as Record<string, ProfilePiece[]>);

  // Ordenar cada grupo por medida (de mayor a menor)
  Object.values(groupedPieces).forEach(group => {
    group.sort((a, b) => parseFloat(b.measure) - parseFloat(a.measure));
  });

  // Obtener todos los tipos de perfiles únicos y ordenarlos por orden de inserción
  const profileTypes = Object.keys(groupedPieces).sort((a, b) => {
    const groupA = groupedPieces[a] || [];
    const groupB = groupedPieces[b] || [];

    // Encontrar el insertionOrder mínimo de cada grupo
    const minOrderA = Math.min(...groupA.map(piece => piece.insertionOrder ?? Infinity));
    const minOrderB = Math.min(...groupB.map(piece => piece.insertionOrder ?? Infinity));

    // Si ambos tienen insertionOrder, ordenar por ese valor
    if (minOrderA !== Infinity && minOrderB !== Infinity) {
      return minOrderA - minOrderB;
    }

    // Si solo uno tiene insertionOrder, ese va primero
    if (minOrderA !== Infinity) return -1;
    if (minOrderB !== Infinity) return 1;

    // Si ninguno tiene insertionOrder, usar orden alfabético como fallback
    return a.localeCompare(b);
  });

  const handleClearAll = () => {
    if (confirm('¿Estás seguro que deseas eliminar todas las piezas de fórmulas? Esta acción no se puede deshacer.')) {
      localStorage.setItem('formulaGeneratorPackagePieces', '[]');
      setPieces([]);
    }
  };

  const handleSavePackage = (name: string) => {
    const packageData = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      pieces,
      totalPieces: pieces.reduce((sum, piece) => sum + piece.pieces, 0),
      profileTypes: [...new Set(pieces.map(piece => piece.type))]
    };

    const savedPackages = JSON.parse(localStorage.getItem('savedFormulaPiecePackages') || '[]');
    savedPackages.push(packageData);
    localStorage.setItem('savedFormulaPiecePackages', JSON.stringify(savedPackages));
    
    setShowSaveModal(false);
    alert('¡Paquete de fórmulas guardado exitosamente!');
  };

  const handleLoadPackage = (packageData: any) => {
    setPieces(packageData.pieces);
    setShowLoadModal(false);
    alert(`Paquete "${packageData.name}" cargado exitosamente!`);
  };

  const handleStartWorking = () => {
    setShowWorkflow(true);
    setCurrentStep(0);
    setCurrentPieceIndex(0);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCurrentPieceIndex(0);
  };

  if (showWorkflow) {
    // Crear una lista plana de todas las piezas ordenadas de mayor a menor
    const workflowSteps = profileTypes.flatMap(type => {
      const typePieces = groupedPieces[type] || [];
      return typePieces.sort((a, b) => parseFloat(b.measure) - parseFloat(a.measure));
    });

    const currentPiece = workflowSteps[currentStep];
    const totalPieces = currentPiece.pieces;
    const isLastPiece = currentPieceIndex === totalPieces - 1;
    const isLastStep = currentStep === workflowSteps.length - 1 && isLastPiece;

    const handleNext = () => {
      if (currentPieceIndex < totalPieces - 1) {
        setCurrentPieceIndex(prev => prev + 1);
      } else if (!isLastStep) {
        setCurrentStep(prev => prev + 1);
        setCurrentPieceIndex(0);
      } else {
        setShowWorkflow(false);
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
          <div className="bg-white text-[#003366] px-6 py-2 rounded-full mt-4">
            <span className="font-bold">FÓRMULAS PERSONALIZADAS</span>
          </div>
          <p className="text-gray-300 text-xl mt-4">
            Paso {currentStep + 1} de {workflowSteps.length}
          </p>
        </div>

        <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-lg">
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg py-3 px-4 mb-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-blue-600 text-5xl font-bold">
                    #{currentPiece.windowType.split(' ').pop()}
                  </span>
                  <span className="text-[#003366] text-4xl font-bold">
                    {currentPiece.windowType.split(' ').slice(0, -1).join(' ')}
                  </span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-[#003366]">{currentPiece.type}</h2>
              <p className="text-gray-500 mt-2">
                Pieza {currentPieceIndex + 1} de {totalPieces}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-[#003366]">
                1 pz {currentPiece.measure} cm
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0 && currentPieceIndex === 0}
                className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 ${
                  currentStep === 0 && currentPieceIndex === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#003366] text-white hover:bg-blue-800 transition-colors'
                }`}
              >
                <ChevronLeft size={20} />
                ANTERIOR
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-[#003366] text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
              >
                {isLastStep ? 'FINALIZAR' : 'SIGUIENTE'}
                {!isLastStep && <ChevronRight size={20} />}
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
          aria-label="Volver al generador de fórmulas"
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
        <h1 className="text-white text-5xl font-bold">PAQUETE DE FÓRMULAS</h1>
        <div className="bg-white text-[#003366] px-6 py-2 rounded-full mt-4">
          <span className="font-bold">PIEZAS DE CALCULADORAS PERSONALIZADAS</span>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-lg p-6 mb-8">
        {profileTypes.map(profileType => {
          const profilePieces = groupedPieces[profileType] || [];
          if (profilePieces.length === 0) return null;

          return (
            <div key={profileType} className="mb-6">
              <h2 className="text-xl font-bold text-[#003366] mb-4">{profileType}</h2>
              <div className="space-y-2">
                {profilePieces.map((piece, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {piece.pieces} pz {piece.measure} cm
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-600 text-lg font-bold">
                          #{piece.windowType.split(' ').pop()}
                        </span>
                        <span className="font-medium">
                          {piece.windowType.split(' ').slice(0, -1).join(' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {pieces.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="mb-4">
              <Package size={64} className="text-gray-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-bold mb-2">No hay piezas de fórmulas</h3>
            <p>Ejecuta calculadoras personalizadas y agrega piezas para verlas aquí</p>
          </div>
        )}

        {pieces.length > 0 && (
          <div className="flex flex-col gap-4 mt-6">
            <button
              onClick={handleStartWorking}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
            >
              EMPEZAR A TRABAJAR
            </button>
            
            <button
              onClick={handleClearAll}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              ELIMINAR TODO
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
      {showSaveModal && (
        <SaveFormulaPiecePackageModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSavePackage}
        />
      )}

      {showLoadModal && (
        <SavedFormulaPiecePackagesModal
          onClose={() => setShowLoadModal(false)}
          onLoadPackage={handleLoadPackage}
        />
      )}
    </div>
  );
}