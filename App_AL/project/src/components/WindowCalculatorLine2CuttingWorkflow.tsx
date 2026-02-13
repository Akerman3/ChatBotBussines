import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { formatMeasurement } from '../hooks/formatMeasurement';

interface WindowCalculatorLine2CuttingWorkflowProps {
  onBack: () => void;
  measurements: {
    jambaVertical: { measure: string; pieces: number };
    jambaHorizontal: { measure: string; pieces: number };
    riel: { measure: string; pieces: number };
    ventilaFijaCercochapa: { measure: string; pieces: number };
    ventilaFijaTraslape: { measure: string; pieces: number };
    ventilaCorrCercochapa: { measure: string; pieces: number };
    ventilaCorrTraslape: { measure: string; pieces: number };
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
  pieces: number;
};

export function WindowCalculatorLine2CuttingWorkflow({ onBack, measurements, zocloSelection }: WindowCalculatorLine2CuttingWorkflowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const jambaHorizontalValue = parseFloat(measurements.jambaHorizontal.measure.replace(' cm', ''));
  const jambaVerticalValue = parseFloat(measurements.jambaVertical.measure.replace(' cm', ''));

  const jambaSteps: Step[] = [];

  if (jambaVerticalValue >= jambaHorizontalValue) {
    jambaSteps.push(
      ...Array(measurements.jambaVertical.pieces).fill(null).map((_, index) => ({
        title: "JAMBA VERTICAL",
        description: `Cortar jamba vertical ${index + 1} de ${measurements.jambaVertical.pieces}`,
        measure: measurements.jambaVertical.measure,
        pieces: 1,
      })),
      {
        title: "JAMBA HORIZONTAL",
        description: "Cortar la jamba horizontal",
        measure: measurements.jambaHorizontal.measure,
        pieces: measurements.jambaHorizontal.pieces,
      }
    );
  } else {
    jambaSteps.push(
      {
        title: "JAMBA HORIZONTAL",
        description: "Cortar la jamba horizontal",
        measure: measurements.jambaHorizontal.measure,
        pieces: measurements.jambaHorizontal.pieces,
      },
      ...Array(measurements.jambaVertical.pieces).fill(null).map((_, index) => ({
        title: "JAMBA VERTICAL",
        description: `Cortar jamba vertical ${index + 1} de ${measurements.jambaVertical.pieces}`,
        measure: measurements.jambaVertical.measure,
        pieces: 1,
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
      pieces: measurements.riel.pieces,
    },

    // 4. Ventila Fija - Cercochapa (1 piece)
    {
      title: "VENTILA FIJA - CERCOCHAPA",
      description: "Cortar el cercochapa de la ventila fija",
      measure: measurements.ventilaFijaCercochapa.measure,
      pieces: measurements.ventilaFijaCercochapa.pieces,
    },

    // 5. Ventila Corrediza - Cercochapa (1 piece)
    {
      title: "VENTILA CORREDIZA - CERCOCHAPA",
      description: "Cortar el cercochapa de la ventila corrediza",
      measure: measurements.ventilaCorrCercochapa.measure,
      pieces: measurements.ventilaCorrCercochapa.pieces,
    },

    // 6. Ventila Fija - Traslape (1 piece)
    {
      title: "VENTILA FIJA - TRASLAPE",
      description: "Cortar el traslape de la ventila fija",
      measure: measurements.ventilaFijaTraslape.measure,
      pieces: measurements.ventilaFijaTraslape.pieces,
    },

    // 7. Ventila Corrediza - Traslape (1 piece)
    {
      title: "VENTILA CORREDIZA - TRASLAPE",
      description: "Cortar el traslape de la ventila corrediza",
      measure: measurements.ventilaCorrTraslape.measure,
      pieces: measurements.ventilaCorrTraslape.pieces,
    },

    // 8. Zoclo Superior (2 pieces)
    ...Array(measurements.zoclo.pieces / 2).fill(null).map((_, index) => ({
      title: zocloSelection.upper.replace('_L2', ''),
      description: `Cortar ${zocloSelection.upper.replace('_L2', '').toLowerCase()} superior`,
      measure: measurements.zoclo.measure,
      pieces: 1,
    })),

    // 9. Zoclo Inferior (2 pieces)
    ...Array(measurements.zoclo.pieces / 2).fill(null).map((_, index) => ({
      title: zocloSelection.lower.replace('_L2', ''),
      description: `Cortar ${zocloSelection.lower.replace('_L2', '').toLowerCase()} inferior`,
      measure: measurements.zoclo.measure,
      pieces: 1,
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
            <h2 className="text-3xl font-bold text-[#003366]">{currentStep.title}</h2>
            <p className="text-gray-600 mt-2">{currentStep.description}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-[#003366]">
              {formatMeasurement(currentStep.pieces, currentStep.measure)}
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