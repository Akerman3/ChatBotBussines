import React from 'react';
import { Scissors, ArrowRight, ArrowDown } from 'lucide-react';
import { CutInstruction, PlateOrientation } from '../utils/glassProjectsDB';
import { transformCutInstructions } from '../utils/plateTransformations';

interface CuttingInstructionsProps {
  instructions: CutInstruction[];
  plateNumber?: number;
  plateWidth?: number;
  plateHeight?: number;
  orientation?: PlateOrientation;
}

export function CuttingInstructions({
  instructions,
  plateNumber,
  plateWidth = 260,
  plateHeight = 180,
  orientation = 'TOP_LEFT'
}: CuttingInstructionsProps) {
  const filteredInstructions = plateNumber
    ? instructions.filter(inst => inst.description.includes(`Placa ${plateNumber}:`))
    : instructions;

  const transformedInstructions = orientation !== 'TOP_LEFT'
    ? transformCutInstructions(filteredInstructions, plateWidth, plateHeight, orientation)
    : filteredInstructions;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Scissors className="text-[#003366]" size={24} />
        <h3 className="text-xl font-bold text-[#003366]">
          {plateNumber ? `Instrucciones de Corte - Placa ${plateNumber}` : 'Instrucciones de Corte Completas'}
        </h3>
      </div>

      {transformedInstructions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay instrucciones de corte disponibles</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transformedInstructions.map((instruction, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold">
                  {instruction.step}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {instruction.type === 'horizontal' ? (
                    <ArrowRight className="text-blue-600" size={20} />
                  ) : (
                    <ArrowDown className="text-green-600" size={20} />
                  )}
                  <span className={`font-semibold ${instruction.type === 'horizontal' ? 'text-blue-700' : 'text-green-700'}`}>
                    Corte {instruction.type === 'horizontal' ? 'Horizontal' : 'Vertical'}
                  </span>
                </div>

                <p className="text-gray-700 mb-1">
                  {instruction.description}
                </p>

                {instruction.resultingPiece && (
                  <div className="mt-2 text-sm text-gray-600 bg-white px-3 py-1 rounded border border-gray-200">
                    Pieza #{instruction.resultingPiece.pieceNumber}: {instruction.resultingPiece.width.toFixed(1)} × {instruction.resultingPiece.height.toFixed(1)} cm
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <span className="font-semibold">Nota:</span> Sigue estas instrucciones en orden para realizar los cortes de manera eficiente y segura.
        </p>
      </div>
    </div>
  );
}
