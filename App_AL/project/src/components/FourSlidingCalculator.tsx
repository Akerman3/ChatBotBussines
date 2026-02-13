import React, { useState } from 'react';
import { ArrowLeft, Settings, ChevronDown, ChevronUp, Check, X, HelpCircle } from 'lucide-react';
import { FourSlidingFormulaCustomizer } from './FourSlidingFormulaCustomizer';
import { FourSlidingCuttingWorkflow } from './FourSlidingCuttingWorkflow';
import { useSyncedState } from '../hooks/useSyncedState';
import { formatMeasurement } from '../hooks/formatMeasurement';
import { roundToDecimalString } from '../utils/roundDecimal';

interface FourSlidingCalculatorProps {
  onBack: () => void;
  onBackToNotes?: () => void;
  initialWidth?: string;
  initialHeight?: string;
  showNotesButton?: boolean;
}

interface Formula {
  jambaVerticalHeight: number;
  ventilaCorrHeight: number;
  rielAdicionalWidth: number;
  zocloWidth: number;
}

interface ZocloSelection {
  upper: string;
  lower: string;
}

export function FourSlidingCalculator({ onBack, onBackToNotes, initialWidth, initialHeight, showNotesButton = false }: FourSlidingCalculatorProps) {
  console.log('🔍 FourSlidingCalculator - Componente renderizado. Prop showNotesButton:', showNotesButton);

  const [width, setWidth] = useSyncedState<string>('fourSlidingWidth', initialWidth || '');
  const [height, setHeight] = useSyncedState<string>('fourSlidingHeight', initialHeight || '');
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState(false);
  const [showCuttingWorkflow, setShowCuttingWorkflow] = useState(false);
  const [isZocloMenuOpen, setIsZocloMenuOpen] = useState(false);
  const [isCustomizingUpper, setIsCustomizingUpper] = useState(false);
  const [isCustomizingLower, setIsCustomizingLower] = useState(false);
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [showGlassHelpTooltip, setShowGlassHelpTooltip] = useState(false);
  const [glassAdjustment, setGlassAdjustment] = useSyncedState<number | string>('fourSlidingGlassAdjustment', 2);
  const [zocloSelection, setZocloSelection] = useSyncedState<ZocloSelection>('fourSlidingZoclo', {
    upper: 'ZOCLO 1V',
    lower: 'ZOCLO 1V'
  });
  const [formula, setFormula] = useSyncedState<Formula>('fourSlidingFormula', {
    jambaVerticalHeight: 2.7,
    ventilaCorrHeight: 3.7,
    rielAdicionalWidth: 2.7,
    zocloWidth: 34,
  });

  const calculateMeasurements = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    return {
      jambaVertical: { measure: (h - formula.jambaVerticalHeight).toFixed(1), pieces: 2 },
      jambaHorizontal: { measure: w.toFixed(1), pieces: 1 },
      riel: { measure: w.toFixed(1), pieces: 1 },
      rielAdicional: { measure: (w - formula.rielAdicionalWidth).toFixed(1), pieces: 1 },
      ventilaCorrCercochapa: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 4 },
      ventilaCorrTraslape: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 4 },
      zoclo: { measure: roundToDecimalString((w - formula.zocloWidth) / 4, 1), pieces: 8 },
    };
  };

  const calculateGlassMeasurements = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    const zocloMeasurements: { [key: string]: number } = {
      'ZOCLO 1V': 5.9,
      'ZOCLO 2V': 7.6,
      'CABEZAL': 3.6
    };

    const upperZoclo = zocloMeasurements[zocloSelection.upper];
    const lowerZoclo = zocloMeasurements[zocloSelection.lower];

    const adjustmentValue = glassAdjustment === '' ? 2 : typeof glassAdjustment === 'string' ? parseFloat(glassAdjustment) : glassAdjustment;
    const glassWidth = roundToDecimalString((w - formula.zocloWidth) / 4 + adjustmentValue, 1);
    const glassHeight = roundToDecimalString(h - formula.ventilaCorrHeight - lowerZoclo - upperZoclo + adjustmentValue, 1);

    return {
      width: glassWidth,
      height: glassHeight
    };
  };

  const handleClear = () => {
    setWidth('');
    setHeight('');
  };

  const handleSaveFormula = (newFormula: Formula) => {
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

  // Efecto para manejar medidas iniciales desde Notas
  React.useEffect(() => {
    console.log('🔍 FourSlidingCalculator - useEffect ejecutado con:', {
      initialWidth,
      initialHeight,
      currentWidth: width,
      currentHeight: height,
      showNotesButton
    });

    // Si viene desde Notas, siempre actualizar las medidas (incluso si parecen iguales)
    if (showNotesButton && initialWidth !== undefined && initialHeight !== undefined) {
      console.log('🔍 FourSlidingCalculator - Forzando actualización desde Notas');
      if (initialWidth !== width) {
        console.log('🔍 FourSlidingCalculator - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight !== height) {
        console.log('🔍 FourSlidingCalculator - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    } else {
      // Comportamiento normal cuando no viene desde Notas
      if (initialWidth && initialWidth !== width) {
        console.log('🔍 FourSlidingCalculator - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight && initialHeight !== height) {
        console.log('🔍 FourSlidingCalculator - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    }
  }, [initialWidth, initialHeight, showNotesButton]);

  const results = calculateMeasurements();
  const glassMeasurements = calculateGlassMeasurements();

  if (showCuttingWorkflow && results) {
    return (
      <FourSlidingCuttingWorkflow
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
        <span>ZOCLO TOTAL:</span>
        {isZocloMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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

      <div className="mt-2">
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
        <h2 className="text-white text-3xl font-bold mt-2">4 CORREDIZAS</h2>
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
            <line x1="8" y1="4" x2="8" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="16" y1="4" x2="16" y2="20" />
          </svg>
          <button
            onClick={() => setShowGlassModal(true)}
            className="absolute -top-2 -right-2 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold px-3 py-2 rounded-lg shadow-lg transition-colors duration-200"
          >
            <div className="leading-tight">
              <div>Contemplar</div>
              <div>Vidrio</div>
            </div>
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
                    {formatMeasurement(results.ventilaCorrCercochapa.pieces, results.ventilaCorrCercochapa.measure)}
                  </span>
                </div>

                <div className="flex border-b border-gray-200 pb-2">
                  <span className="w-44 text-lg font-medium">TRASLAPE:</span>
                  <span className="flex-1 text-right font-bold">
                    {formatMeasurement(results.ventilaCorrTraslape.pieces, results.ventilaCorrTraslape.measure)}
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
                    { type: 'CERCO', measure: results.ventilaCorrCercochapa.measure, pieces: results.ventilaCorrCercochapa.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'TRASLAPE', measure: results.ventilaCorrTraslape.measure, pieces: results.ventilaCorrTraslape.pieces, windowType: `Ventana ${nextWindowNumber}` },
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
                    const adjustmentValue = glassAdjustment === '' ? 2 : typeof glassAdjustment === 'string' ? parseFloat(glassAdjustment) : glassAdjustment;

                    const glassesToAdd = [
                      {
                        windowNumber: nextWindowNumber,
                        windowType: '4 Corredizas - Línea 3',
                        calculatorType: 'four-sliding',
                        glassType: 'corrediza' as const,
                        width: glassMeasurements.width,
                        height: glassMeasurements.height,
                        pieces: 4,
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
                    console.log('🔍 TwoFixedTwoSlidingCalculator - Clic en botón IR A NOTAS. Llamando a onBackToNotes.');
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
        <FourSlidingFormulaCustomizer
          onClose={() => setShowFormulaCustomizer(false)}
          onSave={handleSaveFormula}
        />
      )}

      {showGlassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#003366]">Medidas de Vidrio</h2>
              <button
                onClick={() => setShowGlassModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-500">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-green-800">Ajuste de Aumento de Vidrio</h3>
                <div className="relative">
                  <button
                    onClick={() => setShowGlassHelpTooltip(!showGlassHelpTooltip)}
                    className="text-green-600 hover:text-green-700 transition-colors"
                    type="button"
                  >
                    <HelpCircle size={20} />
                  </button>
                  {showGlassHelpTooltip && (
                    <div className="absolute right-0 top-8 z-50 w-64 max-w-[calc(100vw-2rem)] bg-blue-600 text-white p-4 rounded-lg shadow-xl">
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
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-green-700">Aumento (cm):</label>
                <input
                  type="number"
                  value={glassAdjustment}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setGlassAdjustment('');
                    } else {
                      setGlassAdjustment(parseFloat(value));
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  step="0.1"
                  className="px-3 py-1 border border-green-300 rounded w-20 text-center"
                />
                <button
                  onClick={() => setGlassAdjustment(2)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                >
                  Restablecer
                </button>
              </div>
            </div>

            {glassMeasurements ? (
              <>
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-500">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">VENTILA CORREDIZA</h3>
                  <div className="bg-white p-3 rounded border border-blue-300">
                    <p className="text-blue-900 font-semibold text-center">
                      4 pz de {glassMeasurements.width} cm x {glassMeasurements.height} cm
                    </p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Información de Perfiles:</h3>
                  <p className="text-xs text-gray-600">Perfil Superior: {zocloSelection.upper}</p>
                  <p className="text-xs text-gray-600">Perfil Inferior: {zocloSelection.lower}</p>
                </div>
              </>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <p className="text-yellow-800 text-center">
                  Por favor, ingrese las medidas de ancho y alto primero.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowGlassModal(false)}
              className="w-full bg-[#003366] hover:bg-[#004080] text-white py-3 rounded-lg font-bold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}