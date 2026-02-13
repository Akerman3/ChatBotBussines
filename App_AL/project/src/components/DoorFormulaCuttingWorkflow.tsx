import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

interface FormulaResult {
  profileName: string;
  result: number;
  pieces: number;
}

interface DoorFormulaCuttingWorkflowProps {
  onBack: () => void;
  calculatorName: string;
  results: FormulaResult[];
  measurements: { ancho: string; alto: string };
}

interface WorkflowStep {
  profileName: string;
  measure: number;
  currentPiece: number;
  totalPieces: number;
  stepIndex: number;
}

export function DoorFormulaCuttingWorkflow({
  onBack,
  calculatorName,
  results,
  measurements
}: DoorFormulaCuttingWorkflowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const createWorkflowSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [];
    let stepIndex = 0;

    // Agrupar resultados por nombre de perfil (normalizado a minúsculas)
    const profileGroups = new Map<string, FormulaResult[]>();
    const profileOrder: string[] = [];

    results.forEach(result => {
      const normalizedName = result.profileName.toLowerCase().trim();

      if (!profileGroups.has(normalizedName)) {
        profileGroups.set(normalizedName, []);
        profileOrder.push(normalizedName);
      }

      profileGroups.get(normalizedName)!.push(result);
    });

    // Para cada grupo de perfiles, ordenar de mayor a menor y generar pasos
    profileOrder.forEach(profileKey => {
      const group = profileGroups.get(profileKey)!;

      // Ordenar el grupo de mayor a menor medida
      const sortedGroup = [...group].sort((a, b) => b.result - a.result);

      // Crear pasos para cada resultado en el grupo ordenado
      sortedGroup.forEach(result => {
        for (let i = 0; i < result.pieces; i++) {
          steps.push({
            profileName: result.profileName,
            measure: result.result,
            currentPiece: i + 1,
            totalPieces: result.pieces,
            stepIndex: stepIndex++
          });
        }
      });
    });

    return steps;
  };

  const workflowSteps = createWorkflowSteps();
  const currentStep = workflowSteps[currentStepIndex];
  const isLastStep = currentStepIndex === workflowSteps.length - 1;
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

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-[#003366] flex flex-col items-center justify-center px-4">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">No hay piezas para cortar</h1>
          <button
            onClick={onBack}
            className="bg-white text-[#003366] px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Volver
          </button>
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
          aria-label="Volver al calculador"
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
          <span className="font-bold">{calculatorName}</span>
        </div>
        <p className="text-gray-300 text-xl mt-4">
          Paso {currentStepIndex + 1} de {workflowSteps.length}
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-lg">
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg py-3 px-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-blue-600 text-3xl font-bold">
                  #{measurements.ancho && measurements.alto ? '1' : '1'}
                </span>
                <span className="text-[#003366] text-2xl font-bold">
                  {calculatorName}
                </span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#003366] mb-2">{currentStep.profileName}</h2>
            <p className="text-gray-600 text-lg">
              Pieza {currentStep.currentPiece} de {currentStep.totalPieces}
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Medidas base utilizadas:</p>
              <div className="flex justify-center gap-4 text-sm">
                <span>Ancho: {measurements.ancho} cm</span>
                <span>Alto: {measurements.alto} cm</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-[#003366]">
              1 pz {currentStep.measure.toFixed(1)} cm
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
