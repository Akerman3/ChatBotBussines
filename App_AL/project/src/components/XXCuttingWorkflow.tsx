import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

interface XXCuttingWorkflowProps {
  onBack: () => void;
  measurements: {
    jambaVertical: { measure: string; pieces: number };
    jambaHorizontal: { measure: string; pieces: number };
    riel: { measure: string; pieces: number };
    rielAdicional: { measure: string; pieces: number };
    cercochapa: { measure: string; pieces: number };
    traslape: { measure: string; pieces: number };
    zoclo: { measure: string; pieces: number };
  };
  zocloSelection: {
    upper: string;
    lower: string;
  };
}

type Step = {
  title: string;
  description: string;
  measure: string;
  currentPiece: number;
  totalPieces: number;
};

export function XXCuttingWorkflow({ onBack, measurements, zocloSelection }: XXCuttingWorkflowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const jambaHorizontalValue = parseFloat(measurements.jambaHorizontal.measure.replace(' cm', ''));
  const jambaVerticalValue = parseFloat(measurements.jambaVertical.measure.replace(' cm', ''));

  const jambaSteps: Step[] = [];

  if (jambaVerticalValue >= jambaHorizontalValue) {
    jambaSteps.push(
      ...Array(measurements.jambaVertical.pieces).fill(null).map((_, index) => ({
        title: "JAMBA VERTICAL",
        description: "Cortar jamba vertical",
        measure: measurements.jambaVertical.measure,
        currentPiece: index + 1,
        totalPieces: measurements.jambaVertical.pieces,
      })),
      {
        title: "JAMBA HORIZONTAL",
        description: "Cortar la jamba horizontal",
        measure: measurements.jambaHorizontal.measure,
        currentPiece: 1,
        totalPieces: measurements.jambaHorizontal.pieces,
      }
    );
  } else {
    jambaSteps.push(
      {
        title: "JAMBA HORIZONTAL",
        description: "Cortar la jamba horizontal",
        measure: measurements.jambaHorizontal.measure,
        currentPiece: 1,
        totalPieces: measurements.jambaHorizontal.pieces,
      },
      ...Array(measurements.jambaVertical.pieces).fill(null).map((_, index) => ({
        title: "JAMBA VERTICAL",
        description: "Cortar jamba vertical",
        measure: measurements.jambaVertical.measure,
        currentPiece: index + 1,
        totalPieces: measurements.jambaVertical.pieces,
      }))
    );
  }

  const steps: Step[] = [
    ...jambaSteps,

    // 3. Riel (1 piece)
    {
      title: "RIEL",
      description: "Cortar el riel",
      measure: measurements.riel.measure,
      currentPiece: 1,
      totalPieces: measurements.riel.pieces,
    },

    // 4. Riel Adicional (1 piece)
    {
      title: "RIEL ADICIONAL",
      description: "Cortar el riel adicional",
      measure: measurements.rielAdicional.measure,
      currentPiece: 1,
      totalPieces: measurements.rielAdicional.pieces,
    },

    // 5. Cercochapa (2 pieces)
    ...Array(measurements.cercochapa.pieces).fill(null).map((_, index) => ({
      title: "CERCOCHAPA",
      description: "Cortar cercochapa",
      measure: measurements.cercochapa.measure,
      currentPiece: index + 1,
      totalPieces: measurements.cercochapa.pieces,
    })),

    // 6. Traslape (2 pieces)
    ...Array(measurements.traslape.pieces).fill(null).map((_, index) => ({
      title: "TRASLAPE",
      description: "Cortar traslape",
      measure: measurements.traslape.measure,
      currentPiece: index + 1,
      totalPieces: measurements.traslape.pieces,
    })),

    // 7. Zoclo Superior (2 pieces)
    ...Array(measurements.zoclo.pieces / 2).fill(null).map((_, index) => ({
      title: zocloSelection.upper,
      description: `Cortar ${zocloSelection.upper.toLowerCase()} superior`,
      measure: measurements.zoclo.measure,
      currentPiece: index + 1,
      totalPieces: measurements.zoclo.pieces / 2,
    })),

    // 8. Zoclo Inferior (2 pieces)
    ...Array(measurements.zoclo.pieces / 2).fill(null).map((_, index) => ({
      title: zocloSelection.lower,
      description: `Cortar ${zocloSelection.lower.toLowerCase()} inferior`,
      measure: measurements.zoclo.measure,
      currentPiece: index + 1,
      totalPieces: measurements.zoclo.pieces / 2,
    })),
  ];

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onBack();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
  };

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
        <p className="text-gray-300 text-xl mt-4">Paso {currentStepIndex + 1} de {steps.length}</p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-lg">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#003366]">{currentStep.title} ({currentStep.totalPieces} PZ)</h2>
            <p className="text-gray-600 mt-2">{currentStep.description}</p>
            <p className="text-[#003366] text-xl mt-2">{currentStep.currentPiece} de {currentStep.totalPieces}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-[#003366]">
              {currentStep.measure} cm
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