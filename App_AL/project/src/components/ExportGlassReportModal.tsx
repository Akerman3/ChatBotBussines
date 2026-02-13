import React from 'react';
import { X, Printer } from 'lucide-react';
import { OptimizationResult, PlateOrientation } from '../utils/glassProjectsDB';
import { getOrientationLabel, getOrientationDescription } from '../utils/plateTransformations';

interface ExportGlassReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  plateWidth: number;
  plateHeight: number;
  optimizationResult: OptimizationResult;
  orientation?: PlateOrientation;
}

export function ExportGlassReportModal({
  isOpen,
  onClose,
  projectName,
  plateWidth,
  plateHeight,
  optimizationResult,
  orientation = 'TOP_LEFT'
}: ExportGlassReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 print:hidden">
          <h2 className="text-xl font-bold text-[#003366]">Vista Previa de Impresión</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div id="printable-content" className="print:p-0">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-[#003366] mb-2">
                Reporte de Optimización de Cortes
              </h1>
              <h2 className="text-xl text-gray-700">{projectName}</h2>
              <p className="text-sm text-gray-500 mt-2">
                Fecha: {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-[#003366] mb-3">Configuración de Placa</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Ancho:</span> {plateWidth} cm
                </div>
                <div>
                  <span className="font-semibold">Alto:</span> {plateHeight} cm
                </div>
                <div>
                  <span className="font-semibold">Área total:</span> {(plateWidth * plateHeight / 10000).toFixed(2)} m²
                </div>
                {orientation !== 'TOP_LEFT' && (
                  <div className="col-span-2 mt-2 p-3 bg-green-50 border border-green-200 rounded">
                    <span className="font-semibold text-green-800">Esquina de inicio:</span>{' '}
                    <span className="text-green-900">{getOrientationLabel(orientation)}</span>
                    <div className="text-xs text-green-700 mt-1">
                      {getOrientationDescription(orientation)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-[#003366] mb-3">Resumen de Optimización</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700">Placas Necesarias</div>
                  <div className="text-2xl font-bold text-[#003366]">
                    {optimizationResult.totalPlates}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Aprovechamiento</div>
                  <div className="text-2xl font-bold text-green-600">
                    {optimizationResult.averageUtilization.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Desperdicio Total</div>
                  <div className="text-2xl font-bold text-red-600">
                    {(optimizationResult.totalWaste / 10000).toFixed(2)} m²
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Total Cortes</div>
                  <div className="text-2xl font-bold text-[#003366]">
                    {optimizationResult.instructions.length}
                  </div>
                </div>
              </div>
            </div>

            {optimizationResult.plates.map((plate, idx) => (
              <div key={idx} className="mb-6 page-break-before">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-bold text-[#003366] mb-3">
                    Placa #{plate.plateNumber}
                  </h3>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="font-semibold">Piezas:</span> {plate.pieces.length}
                    </div>
                    <div>
                      <span className="font-semibold">Aprovechamiento:</span>{' '}
                      <span className="text-green-600 font-bold">{plate.utilization.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="font-semibold">Desperdicio:</span>{' '}
                      <span className="text-red-600 font-bold">{plate.wastePercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2">Piezas en esta placa:</h4>
                    <div className="space-y-1 text-sm">
                      {plate.pieces.map((piece, pieceIdx) => (
                        <div key={piece.id} className="flex justify-between">
                          <span>Pieza #{pieceIdx + 1}:</span>
                          <span>
                            {piece.width.toFixed(1)} × {piece.height.toFixed(1)} cm
                            {piece.rotated && <span className="text-blue-600 ml-2">(Rotada ↻)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#003366] mb-3 pb-2 border-b-2 border-[#003366]">
                Instrucciones de Corte Detalladas
              </h3>
              <div className="space-y-2">
                {optimizationResult.instructions.map((instruction, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded text-sm">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {instruction.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-700">
                        {instruction.type === 'horizontal' ? '→' : '↓'} Corte {instruction.type === 'horizontal' ? 'Horizontal' : 'Vertical'}
                      </div>
                      <div className="text-gray-600">{instruction.description}</div>
                      {instruction.resultingPiece && (
                        <div className="text-xs text-gray-500 mt-1">
                          Resultado: {instruction.resultingPiece.width.toFixed(1)} × {instruction.resultingPiece.height.toFixed(1)} cm
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-600 text-center">
              <p>Documento generado por Optimizador de Vidrio</p>
              <p className="mt-1">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}
