import React, { useState, useMemo } from 'react';
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight, RotateCcw, Save, FolderOpen } from 'lucide-react';
import { SavePiecePackageModal } from './SavePiecePackageModal';
import { SavedPiecePackagesModal } from './SavedPiecePackagesModal';

interface ProfilePiece {
  type: string;
  measure: string;
  pieces: number;
  windowType: string;
  zocloProfile?: string;
}

interface PackagePiecesProps {
  onBack: () => void;
}

export function PackagePieces({ onBack }: PackagePiecesProps) {
  const [pieces, setPieces] = useState<ProfilePiece[]>(() =>
    JSON.parse(localStorage.getItem('packagePieces') || '[]')
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const groupedPieces = useMemo(() => {
    const grouped = pieces.reduce((acc, piece) => {
      if (!acc[piece.type]) {
        acc[piece.type] = [];
      }
      acc[piece.type].push(piece);
      return acc;
    }, {} as Record<string, ProfilePiece[]>);

    Object.keys(grouped).forEach(type => {
      const group = grouped[type];

      if (type === 'ZOCLO') {
        const zocloOrder = ['ZOCLO 1V', 'ZOCLO 2V', 'CABEZAL'];
        group.sort((a, b) => {
          const aProfile = a.zocloProfile || '';
          const bProfile = b.zocloProfile || '';
          const aIndex = zocloOrder.indexOf(aProfile);
          const bIndex = zocloOrder.indexOf(bProfile);

          if (aProfile === bProfile) {
            const aMeasure = parseFloat((a.measure || '0').toString().trim());
            const bMeasure = parseFloat((b.measure || '0').toString().trim());
            return bMeasure - aMeasure;
          }

          return aIndex - bIndex;
        });
      } else {
        group.sort((a, b) => {
          const aMeasure = parseFloat((a.measure || '0').toString().trim());
          const bMeasure = parseFloat((b.measure || '0').toString().trim());
          return bMeasure - aMeasure;
        });
      }
    });

    return grouped;
  }, [pieces]);

  const profileOrder = ['JAMBA', 'RIEL', 'CERCO', 'TRASLAPE', 'ZOCLO', 'RIEL ADICIONAL'];

  const handleClearAll = () => {
    if (confirm('¿Estás seguro que deseas eliminar todas las piezas? Esta acción no se puede deshacer.')) {
      localStorage.setItem('packagePieces', '[]');
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

    const savedPackages = JSON.parse(localStorage.getItem('savedPiecePackages') || '[]');
    savedPackages.push(packageData);
    localStorage.setItem('savedPiecePackages', JSON.stringify(savedPackages));
    
    setShowSaveModal(false);
    alert('¡Paquete de piezas guardado exitosamente!');
  };

  const handleLoadPackage = (packageData: any) => {
    localStorage.setItem('packagePieces', JSON.stringify(packageData.pieces));
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
    const workflowSteps = profileOrder.flatMap(type => {
      const typePieces = groupedPieces[type] || [];
      return [...typePieces];
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
          <p className="text-gray-300 text-xl mt-4">
            Paso {currentStep + 1} de {workflowSteps.length}
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
        <h1 className="text-white text-5xl font-bold">PAQUETE DE PIEZAS</h1>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-lg p-6 mb-8">
        {profileOrder.map(profileType => {
          const profilePieces = groupedPieces[profileType] || [];
          if (profilePieces.length === 0) return null;

          return (
            <div key={profileType} className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#003366]">{profileType}</h2>
                <span className="text-xs text-gray-500 italic">ordenadas de mayor a menor</span>
              </div>
              <div className="space-y-2">
                {profilePieces.map((piece, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {piece.pieces} pz {piece.measure} cm
                      </span>
                      <span className="font-medium">{piece.windowType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {pieces.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No hay piezas agregadas al paquete
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
    </div>
  );
}