import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Check, Settings, X, HelpCircle } from 'lucide-react';
import { formatMeasurement } from '../hooks/formatMeasurement';
import { useSyncedState } from '../hooks/useSyncedState';
import { roundToDecimalString } from '../utils/roundDecimal';
import { XXCuttingWorkflow } from './XXCuttingWorkflow';
import { XXFormulaCustomizer } from './XXFormulaCustomizer';

interface XXCalculatorProps {
  onBack: () => void;
  onBackToNotes?: () => void;
  initialWidth?: string;
  initialHeight?: string;
  showNotesButton?: boolean;
  line: 'L2' | 'L3';
}

interface ZocloSelection {
  upper: string;
  lower: string;
}

interface Formula {
  jambaVerticalHeight: number;
  ventilaCorrHeight: number;
  rielAdicionalWidth: number;
  zocloWidth: number;
}

export function XXCalculator({ onBack, onBackToNotes, initialWidth, initialHeight, showNotesButton = false, line }: XXCalculatorProps) {
  console.log('🔍 XXCalculator - Componente renderizado. Props:', { showNotesButton, line });
  
  const [width, setWidth] = useSyncedState<string>('xxWidth', initialWidth || '');
  const [height, setHeight] = useSyncedState<string>('xxHeight', initialHeight || '');
  const [showCuttingWorkflow, setShowCuttingWorkflow] = useState(false);
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState(false);
  const [isZocloMenuOpen, setIsZocloMenuOpen] = useState(false);
  const [isCustomizingUpper, setIsCustomizingUpper] = useState(false);
  const [isCustomizingLower, setIsCustomizingLower] = useState(false);
  const [zocloSelection, setZocloSelection] = useSyncedState<ZocloSelection>('xxZocloSelection', {
    upper: 'ZOCLO 1V',
    lower: 'ZOCLO 1V'
  });
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [showGlassHelpTooltip, setShowGlassHelpTooltip] = useState(false);
  const [glassAdjustment, setGlassAdjustment] = useSyncedState<number | string>('xxGlassAdjustment', 2);

  // Definir fórmulas predeterminadas por línea
  const defaultFormulas = {
    L3: {
      jambaVerticalHeight: 2.7,
      ventilaCorrHeight: 3.7,
      rielAdicionalWidth: 2.7,
      zocloWidth: 18,
    },
    L2: {
      jambaVerticalHeight: 2.8,
      ventilaCorrHeight: 4.0,
      rielAdicionalWidth: 2.7,
      zocloWidth: 16.2,
    },
  };
  
  const [formula, setFormula] = useState<Formula>(() => {
    const formulaKey = `xxFormula_${line}`;
    const savedFormula = localStorage.getItem(formulaKey);
    return savedFormula ? JSON.parse(savedFormula) : defaultFormulas[line];
  });

  // Efecto para manejar medidas iniciales desde Notas
  React.useEffect(() => {
    console.log('🔍 XXCalculator - useEffect ejecutado con:', {
      initialWidth,
      initialHeight,
      currentWidth: width,
      currentHeight: height,
      showNotesButton
    });

    // Si viene desde Notas, siempre actualizar las medidas (incluso si parecen iguales)
    if (showNotesButton && initialWidth !== undefined && initialHeight !== undefined) {
      console.log('🔍 XXCalculator - Forzando actualización desde Notas');
      if (initialWidth !== width) {
        console.log('🔍 XXCalculator - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight !== height) {
        console.log('🔍 XXCalculator - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    } else {
      // Comportamiento normal cuando no viene desde Notas
      if (initialWidth && initialWidth !== width) {
        console.log('🔍 XXCalculator - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight && initialHeight !== height) {
        console.log('🔍 XXCalculator - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    }
  }, [initialWidth, initialHeight, showNotesButton]);

  const calculateMeasurements = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    return {
      jambaVertical: { measure: (h - formula.jambaVerticalHeight).toFixed(1), pieces: 2 },
      jambaHorizontal: { measure: w.toFixed(1), pieces: 1 },
      riel: { measure: w.toFixed(1), pieces: 1 },
      rielAdicional: { measure: (w - formula.rielAdicionalWidth).toFixed(1), pieces: 1 },
      cercochapa: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 2 },
      traslape: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 2 },
      zoclo: { measure: roundToDecimalString((w - formula.zocloWidth) / 2, 1), pieces: 4 },
    };
  };

  const calculateGlassMeasurements = () => {
    if (!results) return null;

    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    const ZOCLO_MEASUREMENTS: { [key: string]: number } = line === 'L2'
      ? {
          'ZOCLO 1V': 3.7,
          'ZOCLO 2V': 7.5,
          'CABEZAL': 3.7
        }
      : {
          'ZOCLO 1V': 5.9,
          'ZOCLO 2V': 7.6,
          'CABEZAL': 3.6
        };

    const zocloInferior = ZOCLO_MEASUREMENTS[zocloSelection.lower] || 5.9;
    const zocloSuperior = ZOCLO_MEASUREMENTS[zocloSelection.upper] || 5.9;

    const adjustmentValue = typeof glassAdjustment === 'string' ? 0 : glassAdjustment;
    const glassWidth = parseFloat(results.zoclo.measure) + adjustmentValue;
    const glassHeightCorrediza = h - formula.ventilaCorrHeight - zocloInferior - zocloSuperior + adjustmentValue;

    return {
      width: glassWidth.toFixed(1),
      heightCorrediza: glassHeightCorrediza.toFixed(1)
    };
  };

  const handleClear = () => {
    setWidth('');
    setHeight('');
  };

  const handleSaveFormula = (newFormula: Formula) => {
    const formulaKey = `xxFormula_${line}`;
    localStorage.setItem(formulaKey, JSON.stringify(newFormula));
    setFormula(newFormula);
    setShowFormulaCustomizer(false);
  };

  const handleZocloSelect = (position: 'upper' | 'lower', profile: string) => {
    setZocloSelection({
      ...zocloSelection,
      [position]: profile
    });
    
    if (position === 'upper') {
      setIsCustomizingUpper(false);
    } else {
      setIsCustomizingLower(false);
    }
  };

  const results = calculateMeasurements();
  const glassMeasurements = calculateGlassMeasurements();

  if (showCuttingWorkflow && results) {
    return (
      <XXCuttingWorkflow
        onBack={() => setShowCuttingWorkflow(false)}
        measurements={results}
        zocloSelection={zocloSelection}
      />
    );
  }

  const ZocloDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setIsZocloMenuOpen(!isZocloMenuOpen)}
        className="w-full flex items-center justify-between text-lg font-medium text-[#003366] focus:outline-none"
      >
        <span>ZOCLO:</span>
        <div className="flex items-center gap-4">
          <span className="font-bold">{formatMeasurement(results?.zoclo.pieces || 0, results?.zoclo.measure || '')}</span>
          {isZocloMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {isZocloMenuOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-2">
            <button
              onClick={() => setIsCustomizingUpper(true)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
            >
              Personalizar Perfil Superior
            </button>
            <button
              onClick={() => setIsCustomizingLower(true)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
            >
              Personalizar Perfil Inferior
            </button>
          </div>
        </div>
      )}

      {(isCustomizingUpper || isCustomizingLower) && (
        <div className="absolute z-20 w-64 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-2">
            {['ZOCLO 1V', 'ZOCLO 2V', 'CABEZAL'].map((profile) => (
              <button
                key={profile}
                onClick={() => handleZocloSelect(
                  isCustomizingUpper ? 'upper' : 'lower',
                  profile
                )}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 rounded"
              >
                <span>{profile}</span>
                {((isCustomizingUpper && zocloSelection.upper === profile) ||
                  (isCustomizingLower && zocloSelection.lower === profile)) && (
                  <Check size={16} className="text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 pl-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Superior ({zocloSelection.upper}):</span>
          <div className="font-bold">{formatMeasurement(results?.zoclo.pieces / 2 || 0, results?.zoclo.measure || '')}</div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm">Inferior ({zocloSelection.lower}):</span>
          <div className="font-bold">{formatMeasurement(results?.zoclo.pieces / 2 || 0, results?.zoclo.measure || '')}</div>
        </div>
      </div>
    </div>
  );

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
        <h1 className="text-white text-5xl font-bold">VENTANA</h1>
        <h2 className="text-white text-3xl font-bold mt-2">DOBLE CORREDIZA</h2>
      </div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8 relative">
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
            <rect x="4" y="4" width="16" height="16" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
          <button
            onClick={() => setShowGlassModal(true)}
            className="absolute top-0 right-0 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all hover:scale-110 text-sm font-semibold text-gray-800 leading-tight"
            aria-label="Contemplar vidrios"
          >
            <span>Contemplar</span>
            <span>Vidrio</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-white text-xl font-bold mb-4">INGRESE MEDIDAS EN CM</h3>
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        {results && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="space-y-4 text-[#003366]">
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">JAMBA:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.jambaHorizontal.pieces, results.jambaHorizontal.measure)} - {formatMeasurement(results.jambaVertical.pieces, results.jambaVertical.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">RIEL:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.riel.pieces, results.riel.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">RIEL ADICIONAL:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.rielAdicional.pieces, results.rielAdicional.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">CERCOCHAPA:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.cercochapa.pieces, results.cercochapa.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">TRASLAPE:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.traslape.pieces, results.traslape.measure)}
                  </span>
                </div>

                <div className="relative border-b border-gray-200 pb-2">
                  <ZocloDropdown />
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
                onClick={() => setShowCuttingWorkflow(true)}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
              >
                EMPEZAR A TRABAJAR
              </button>

              <button
                onClick={() => {
                  if (!results) {
                    alert('Por favor, ingrese las medidas primero');
                    return;
                  }

                  const currentPieces = JSON.parse(localStorage.getItem('packagePieces') || '[]');
                  const nextWindowNumber = currentPieces.length > 0 ? Math.max(...currentPieces.map((p: any) => {
                    const match = p.windowType?.match(/Ventana (\d+)/);
                    return match ? parseInt(match[1]) : 0;
                  })) + 1 : 1;

                  const piecesToAdd = [
                    { type: 'JAMBA', measure: results.jambaVertical.measure, pieces: results.jambaVertical.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'JAMBA', measure: results.jambaHorizontal.measure, pieces: results.jambaHorizontal.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'RIEL', measure: results.riel.measure, pieces: results.riel.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'RIEL ADICIONAL', measure: results.rielAdicional.measure, pieces: results.rielAdicional.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'CERCO', measure: results.cercochapa.measure, pieces: results.cercochapa.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'TRASLAPE', measure: results.traslape.measure, pieces: results.traslape.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    {
                      type: 'ZOCLO',
                      measure: results.zoclo.measure,
                      pieces: results.zoclo.pieces / 2,
                      windowType: `Ventana ${nextWindowNumber}`,
                      zocloType: 'upper',
                      zocloProfile: zocloSelection.upper
                    },
                    {
                      type: 'ZOCLO',
                      measure: results.zoclo.measure,
                      pieces: results.zoclo.pieces / 2,
                      windowType: `Ventana ${nextWindowNumber}`,
                      zocloType: 'lower',
                      zocloProfile: zocloSelection.lower
                    }
                  ];

                  localStorage.setItem('packagePieces', JSON.stringify([...currentPieces, ...piecesToAdd]));

                  if (glassMeasurements) {
                    const currentGlasses = JSON.parse(localStorage.getItem('packageGlasses') || '[]');
                    const adjustmentValue = typeof glassAdjustment === 'string' ? 0 : glassAdjustment;
                    const lineLabel = line === 'L2' ? 'Línea 2' : 'Línea 3';

                    const glassesToAdd = [
                      {
                        windowNumber: nextWindowNumber,
                        windowType: `Doble Corrediza - ${lineLabel}`,
                        calculatorType: 'double-sliding',
                        glassType: 'corrediza' as const,
                        width: glassMeasurements.width,
                        height: glassMeasurements.heightCorrediza,
                        pieces: 2,
                        zocloUpper: zocloSelection.upper,
                        zocloLower: zocloSelection.lower,
                        adjustment: adjustmentValue
                      }
                    ];

                    localStorage.setItem('packageGlasses', JSON.stringify([...currentGlasses, ...glassesToAdd]));
                  }

                  alert('¡Piezas agregadas al paquete!');
                }}
                className={`w-full py-3 rounded-lg font-bold ${
                  !results ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
              >
                AGREGAR A PAQUETE DE PIEZAS
              </button>
              
              <button
                onClick={() => {
                  if (onBackToNotes) {
                    console.log('🔍 XXCalculator - Clic en botón IR A NOTAS. Llamando a onBackToNotes.');
                    onBackToNotes();
                  }
                }}
                className={`w-full bg-indigo-500 text-white py-3 rounded-lg font-bold hover:bg-indigo-600 transition-colors mt-4 ${showNotesButton ? 'block' : 'hidden'}`}
              >
                IR A NOTAS
              </button>
            </div>
          </>
        )}
      </div>

      {showFormulaCustomizer && (
        <XXFormulaCustomizer
          onClose={() => setShowFormulaCustomizer(false)}
          onSave={handleSaveFormula}
          line={line}
        />
      )}

      {showGlassModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
          onClick={() => setShowGlassModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGlassModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-[#003366] mb-6 text-center">
              Contemplar Vidrios
            </h2>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings size={20} className="text-green-600" />
                  <h3 className="text-base font-bold text-[#003366]">Ajuste de Aumento de Vidrio:</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowGlassHelpTooltip(!showGlassHelpTooltip)}
                      className="text-green-600 hover:text-green-700 transition-colors"
                      type="button"
                    >
                      <HelpCircle size={18} />
                    </button>
                    {showGlassHelpTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-64 max-w-[calc(100vw-2rem)] bg-blue-600 text-white p-4 rounded-lg shadow-xl">
                        <button
                          onClick={() => setShowGlassHelpTooltip(false)}
                          className="absolute top-2 right-2 text-white hover:text-gray-200"
                          type="button"
                        >
                          <X size={16} />
                        </button>
                        <p className="text-sm leading-relaxed">
                          En este campo podrás contemplar aumento que entra dentro del canal del marco donde se fija con vinil, por defecto se contempla 2cm pero se puede ajustar a tu comodidad.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setGlassAdjustment(2)}
                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md font-semibold transition-colors"
                >
                  Restablecer
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={glassAdjustment}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setGlassAdjustment('');
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setGlassAdjustment(numValue);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 px-3 py-2 border-2 border-green-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:border-green-500"
                />
                <span className="text-gray-600 font-medium">cm</span>
              </div>
            </div>

            {glassMeasurements ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-400 rounded-lg p-6 overflow-hidden">
                  <div className="bg-blue-500 -mx-6 -mt-6 mb-4 px-6 py-3">
                    <h3 className="text-lg font-bold text-white text-center">VENTILA CORREDIZA</h3>
                  </div>
                  <p className="text-gray-800 font-bold text-lg text-center">
                    2 pz de {glassMeasurements.width} cm x {glassMeasurements.heightCorrediza} cm
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Información de Perfiles:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Zócalo Superior: <span className="font-semibold">{zocloSelection.upper}</span></p>
                    <p>Zócalo Inferior: <span className="font-semibold">{zocloSelection.lower}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center mb-8">
                Por favor, ingresa las medidas de la ventana para calcular los vidrios.
              </p>
            )}

            <button
              onClick={() => setShowGlassModal(false)}
              className="w-full bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors mt-6"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}