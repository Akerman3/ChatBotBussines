import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

interface DoorCuttingWorkflowProps {
  onBack: () => void;
  measurements: {
    batienteHorizontal: { measure: string; pieces: number };
    batienteVertical: { measure: string; pieces: number };
    cercoChapa: { measure: string; pieces: number };
    zoclo: { measure: string; pieces: number };
    duela: { measure: string; pieces: number };
  };
}

type Step = {
  title: string;
  description: string;
  measure: string;
  currentPiece: number;
  totalPieces: number;
};

export function DoorCuttingWorkflow({ onBack, measurements }: DoorCuttingWorkflowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const batienteHorizontalValue = parseFloat(measurements.batienteHorizontal.measure.replace(' cm', ''));
  const batienteVerticalValue = parseFloat(measurements.batienteVertical.measure.replace(' cm', ''));

  const batienteSteps: Step[] = [];

  if (batienteVerticalValue >= batienteHorizontalValue) {
    batienteSteps.push(
      ...Array(measurements.batienteVertical.pieces).fill(null).map((_, index) => ({
        title: "BATIENTE VERTICAL",
        description: "Cortar batiente vertical",
        measure: measurements.batienteVertical.measure,
        currentPiece: index + 1,
        totalPieces: measurements.batienteVertical.pieces,
      })),
      {
        title: "BATIENTE HORIZONTAL",
        description: "Cortar el batiente horizontal",
        measure: measurements.batienteHorizontal.measure,
        currentPiece: 1,
        totalPieces: measurements.batienteHorizontal.pieces,
      }
    );
  } else {
    batienteSteps.push(
      {
        title: "BATIENTE HORIZONTAL",
        description: "Cortar el batiente horizontal",
        measure: measurements.batienteHorizontal.measure,
        currentPiece: 1,
        totalPieces: measurements.batienteHorizontal.pieces,
      },
      ...Array(measurements.batienteVertical.pieces).fill(null).map((_, index) => ({
        title: "BATIENTE VERTICAL",
        description: "Cortar batiente vertical",
        measure: measurements.batienteVertical.measure,
        currentPiece: index + 1,
        totalPieces: measurements.batienteVertical.pieces,
      }))
    );
  }

  const steps: Step[] = [
    ...batienteSteps,

    // 3. Cerco Chapa (2 pieces)
    ...Array(measurements.cercoChapa.pieces).fill(null).map((_, index) => ({
      title: "CERCO CHAPA",
      description: "Cortar cerco chapa",
      measure: measurements.cercoChapa.measure,
      currentPiece: index + 1,
      totalPieces: measurements.cercoChapa.pieces,
    })),

    // 4. Zoclo (2 pieces)
    ...Array(measurements.zoclo.pieces).fill(null).map((_, index) => ({
      title: "ZOCLO",
      description: "Cortar zoclo",
      measure: measurements.zoclo.measure,
      currentPiece: index + 1,
      totalPieces: measurements.zoclo.pieces,
    })),

    // 5. Duela (cantidad seleccionada)
    ...Array(measurements.duela.pieces).fill(null).map((_, index) => ({
      title: "DUELA",
      description: "Cortar duela",
      measure: measurements.duela.measure,
      currentPiece: index + 1,
      totalPieces: measurements.duela.pieces,
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
        <div className="bg-blue-50 rounded-lg py-3 px-4 mt-4 inline-block">
          <span className="text-[#003366] text-4xl font-bold">
            Paso {currentStepIndex + 1} de {steps.length}
          </span>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-lg">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#003366]">{currentStep.title}</h2>
            <p className="text-gray-600 mt-2">{currentStep.description}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-[#003366]">
              1 pz {currentStep.measure} cm
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