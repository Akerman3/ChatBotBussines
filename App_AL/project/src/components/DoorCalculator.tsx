import React, { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { DoorCuttingWorkflow } from './DoorCuttingWorkflow';
import { DoorFormulaCustomizer } from './DoorFormulaCustomizer';
import { useSyncedState } from '../hooks/useSyncedState';
import { formatMeasurement } from '../hooks/formatMeasurement';
import { roundToDecimalString } from '../utils/roundDecimal';

interface DoorCalculatorProps {
  onBack: () => void;
  initialWidth?: string;
  initialHeight?: string;
  initialDrag?: string;
}

interface Formula {
  batienteVerticalHeight: number;
  cercochapaHeight: number;
  zocloWidth: number;
  duelaWidth: number;
}

export function DoorCalculator({ onBack, initialWidth, initialHeight, initialDrag }: DoorCalculatorProps) {
  const [width, setWidth] = useSyncedState<string>('doorWidth', initialWidth || '');
  const [height, setHeight] = useSyncedState<string>('doorHeight', initialHeight || '');
  const [drag, setDrag] = useSyncedState<string>('doorDrag', initialDrag || '');
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState(false);
  const [showCuttingWorkflow, setShowCuttingWorkflow] = useState(false);
  const [selectedDuelaPieces, setSelectedDuelaPieces] = useState(1);
  const [formula, setFormula] = useSyncedState<Formula>('doorFormula', {
    batienteVerticalHeight: 1.3,
    cercochapaHeight: 1.7,
    zocloWidth: 13.7,
    duelaWidth: 2,
  });

  const calculateMeasurements = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    const d = parseFloat(drag);
    
    if (!w || !h || !d) return null;

    const batienteHorizontalMeasure = w.toFixed(1);
    const batienteVerticalMeasure = (h - formula.batienteVerticalHeight).toFixed(1);

    return {
      batienteHorizontal: { measure: batienteHorizontalMeasure, pieces: 1 },
      batienteVertical: { measure: batienteVerticalMeasure, pieces: 2 },
      cercoChapa: { measure: (h - formula.cercochapaHeight - d).toFixed(1), pieces: 2 },
      zoclo: { measure: roundToDecimalString(w - formula.zocloWidth, 1), pieces: 2 },
      duela: { measure: ((w - formula.zocloWidth) + formula.duelaWidth).toFixed(1), pieces: selectedDuelaPieces },
    };
  };

  const handleClear = () => {
    setWidth('');
    setHeight('');
    setDrag('');
  };

  const handleSaveFormula = (newFormula: Formula) => {
    setFormula(newFormula);
    setShowFormulaCustomizer(false);
  };

  // Efecto para manejar medidas iniciales desde Notas
  React.useEffect(() => {
    console.log('🔍 DoorCalculator - useEffect ejecutado con:', {
      initialWidth,
      initialHeight,
      initialDrag,
      currentWidth: width,
      currentHeight: height,
      currentDrag: drag
    });

    // Actualizar medidas cuando cambien los valores iniciales
    if (initialWidth && initialWidth !== width) {
      console.log('🔍 DoorCalculator - Actualizando width de', width, 'a', initialWidth);
      setWidth(initialWidth);
    }
    if (initialHeight && initialHeight !== height) {
      console.log('🔍 DoorCalculator - Actualizando height de', height, 'a', initialHeight);
      setHeight(initialHeight);
    }
    if (initialDrag && initialDrag !== drag) {
      console.log('🔍 DoorCalculator - Actualizando drag de', drag, 'a', initialDrag);
      setDrag(initialDrag);
    }
  }, [initialWidth, initialHeight, initialDrag]);

  const results = calculateMeasurements();

  if (showCuttingWorkflow && results) {
    return (
      <DoorCuttingWorkflow
        onBack={() => setShowCuttingWorkflow(false)}
        measurements={results}
      />
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
        <button
          onClick={() => setShowFormulaCustomizer(true)}
          className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
        >
          <Settings size={24} />
          <span>Personalizar Fórmula</span>
        </button>
      </div>

      <div className="text-center my-8">
        <h1 className="text-white text-5xl font-bold">PUERTA</h1>
        <h2 className="text-white text-3xl font-bold mt-2">LÍNEA NACIONAL DE 3</h2>
      </div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <rect x="4" y="4" width="12" height="16" />
            <line x1="4" y1="12" x2="16" y2="12" />
            <circle cx="14" cy="12" r="1" />
          </svg>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-white text-xl font-bold mb-4">INGRESE MEDIDAS EN CM</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white text-lg mb-2">ANCHO</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-center text-xl"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-white text-lg mb-2">ALTO</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-center text-xl"
                placeholder="0.0"
              />
            </div>
          </div>
          <div>
            <label className="block text-white text-lg mb-2">ARRASTRE</label>
            <input
              type="number"
              value={drag}
              onChange={(e) => setDrag(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-center text-xl"
              placeholder="0.0"
            />
          </div>
        </div>

        {results && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="space-y-4 text-[#003366]">
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">BATIENTE:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.batienteHorizontal.pieces, results.batienteHorizontal.measure)} - {formatMeasurement(results.batienteVertical.pieces, results.batienteVertical.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">CERCO CHAPA:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.cercoChapa.pieces, results.cercoChapa.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">ZOCLO:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.zoclo.pieces, results.zoclo.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">DUELA:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(selectedDuelaPieces, results.duela.measure)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-medium">Cantidad de Duelas:</span>
                  <select
                    value={selectedDuelaPieces}
                    onChange={(e) => setSelectedDuelaPieces(parseInt(e.target.value))}
                    className="px-4 py-2 border rounded-lg"
                  >
                    {(() => {
                      const duelaMeasurements = [
                        14.2, 26.7, 39.2, 51.6, 64.1, 76.6, 89.1, 101.6, 114.0, 126.5,
                        139.0, 151.5, 164.0, 176.4, 188.9, 201.4, 213.9, 226.4, 238.8,
                        251.3, 263.8, 276.3, 288.8, 301.2, 313.7, 326.2, 338.7, 351.2,
                        363.6, 376.1
                      ];
                      
                      return Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} pieza{num > 1 ? 's' : ''} ({duelaMeasurements[num - 1]} cm)
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between gap-4">
                <button
                  onClick={handleClear}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                  BORRAR
                </button>
                <button
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors hidden"
                >
                  COMPARTIR
                </button>
              </div>
              
              <button
                onClick={() => {
                  console.log('DoorCalculator - Empezar a Trabajar clicked with width:', width, 'height:', height, 'drag:', drag);
                  setShowCuttingWorkflow(true);
                }}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
              >
                EMPEZAR A TRABAJAR
              </button>
            </div>
          </>
        )}
      </div>

      {showFormulaCustomizer && (
        <DoorFormulaCustomizer
          onClose={() => setShowFormulaCustomizer(false)}
          onSave={handleSaveFormula}
        />
      )}
    </div>
  );
}