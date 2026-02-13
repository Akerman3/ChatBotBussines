import React, { useState } from 'react';
import { ArrowLeft, Settings, ChevronDown, ChevronUp, Check, X, HelpCircle } from 'lucide-react';
import { TwoFixedTwoSlidingFormulaCustomizer } from './TwoFixedTwoSlidingFormulaCustomizer';
import { TwoFixedTwoSlidingCuttingWorkflow } from './TwoFixedTwoSlidingCuttingWorkflow';
import { useSyncedState } from '../hooks/useSyncedState';
import { formatMeasurement } from '../hooks/formatMeasurement';
import { roundToDecimalString } from '../utils/roundDecimal';

interface TwoFixedTwoSlidingCalculatorProps {
  onBack: () => void;
  onBackToNotes?: () => void;
  initialWidth?: string;
  initialHeight?: string;
  showNotesButton?: boolean;
}

interface Formula {
  jambaVerticalHeight: number;
  ventilaFijaHeight: number;
  ventilaCorrHeight: number;
  zocloWidth: number;
}

interface ZocloSelection {
  upper: string;
  lower: string;
}

export function TwoFixedTwoSlidingCalculator({ onBack, onBackToNotes, initialWidth, initialHeight, showNotesButton = false }: TwoFixedTwoSlidingCalculatorProps) {
  console.log('🔍 TwoFixedTwoSlidingCalculator - Componente renderizado. Prop showNotesButton:', showNotesButton);

  const [width, setWidth] = useSyncedState<string>('twoFixedTwoSlidingWidth', initialWidth || '');
  const [height, setHeight] = useSyncedState<string>('twoFixedTwoSlidingHeight', initialHeight || '');
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState(false);
  const [showCuttingWorkflow, setShowCuttingWorkflow] = useState(false);
  const [isZocloMenuOpen, setIsZocloMenuOpen] = useState(false);
  const [isCustomizingUpper, setIsCustomizingUpper] = useState(false);
  const [isCustomizingLower, setIsCustomizingLower] = useState(false);
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [showGlassHelpTooltip, setShowGlassHelpTooltip] = useState(false);
  const [glassAdjustment, setGlassAdjustment] = useSyncedState<number | string>('twoFixedTwoSlidingGlassAdjustment', 2);
  const [zocloSelection, setZocloSelection] = useSyncedState<ZocloSelection>('twoFixedTwoSlidingZoclo', {
    upper: 'ZOCLO 1V',
    lower: 'ZOCLO 1V'
  });
  const [formula, setFormula] = useSyncedState<Formula>('twoFixedTwoSlidingFormula', {
    jambaVerticalHeight: 2.7,
    ventilaFijaHeight: 2.8,
    ventilaCorrHeight: 3.7,
    zocloWidth: 33.5,
  });

  const calculateMeasurements = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    return {
      jambaVertical: { measure: (h - formula.jambaVerticalHeight).toFixed(1), pieces: 2 },
      jambaHorizontal: { measure: w.toFixed(1), pieces: 1 },
      riel: { measure: w.toFixed(1), pieces: 1 },
      ventilaFijaCercochapa: { measure: (h - formula.ventilaFijaHeight).toFixed(1), pieces: 2 },
      ventilaFijaTraslape: { measure: (h - formula.ventilaFijaHeight).toFixed(1), pieces: 2 },
      ventilaCorrCercochapa: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 2 },
      ventilaCorrTraslape: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 2 },
      zoclo: { measure: roundToDecimalString((w - formula.zocloWidth) / 4, 1), pieces: 8 },
    };
  };

  const calculateGlassMeasurements = () => {
    if (!results) return null;

    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    const ZOCLO_MEASUREMENTS: { [key: string]: number } = {
      'ZOCLO 1V': 5.9,
      'ZOCLO 2V': 7.6,
      'CABEZAL': 3.6
    };

    const zocloInferior = ZOCLO_MEASUREMENTS[zocloSelection.lower] || 5.9;
    const zocloSuperior = ZOCLO_MEASUREMENTS[zocloSelection.upper] || 5.9;

    const adjustmentValue = typeof glassAdjustment === 'string' ? 0 : glassAdjustment;
    const glassWidth = parseFloat(results.zoclo.measure) + adjustmentValue;
    const glassHeightFija = h - formula.ventilaFijaHeight - zocloInferior - zocloSuperior + adjustmentValue;
    const glassHeightCorrediza = h - formula.ventilaCorrHeight - zocloInferior - zocloSuperior + adjustmentValue;

    return {
      width: glassWidth.toFixed(1),
      heightFija: glassHeightFija.toFixed(1),
      heightCorrediza: glassHeightCorrediza.toFixed(1)
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
    console.log('🔍 TwoFixedTwoSlidingCalculator - useEffect ejecutado con:', {
      initialWidth,
      initialHeight,
      currentWidth: width,
      currentHeight: height,
      showNotesButton
    });

    // Si viene desde Notas, siempre actualizar las medidas (incluso si parecen iguales)
    if (showNotesButton && initialWidth !== undefined && initialHeight !== undefined) {
      console.log('🔍 TwoFixedTwoSlidingCalculator - Forzando actualización desde Notas');
      if (initialWidth !== width) {
        console.log('🔍 TwoFixedTwoSlidingCalculator - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight !== height) {
        console.log('🔍 TwoFixedTwoSlidingCalculator - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    } else {
      // Comportamiento normal cuando no viene desde Notas
      if (initialWidth && initialWidth !== width) {
        console.log('🔍 TwoFixedTwoSlidingCalculator - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight && initialHeight !== height) {
        console.log('🔍 TwoFixedTwoSlidingCalculator - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    }
  }, [initialWidth, initialHeight, showNotesButton]);

  const results = calculateMeasurements();
  const glassMeasurements = calculateGlassMeasurements();

  if (showCuttingWorkflow && results) {
    return (
      <TwoFixedTwoSlidingCuttingWorkflow
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
          <div className="font-bold">{formatMeasurement(results?.zoclo.pieces / 2 || 0, results?.zoclo.measure || '0.0')}</div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm">Inferior ({zocloSelection.lower}):</span>
          <div className="font-bold">{formatMeasurement(results?.zoclo.pieces / 2 || 0, results?.zoclo.measure || '0.0')}</div>
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
        <h2 className="text-white text-3xl font-bold mt-2">2 FIJOS 2 CORREDIZOS</h2>
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

                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <div className="flex">
                    <span className="w-44 text-lg font-medium">VENTILA FIJA:</span>
                    <span className="flex-1 text-right font-bold">
                      CERCOCHAPA: {formatMeasurement(results.ventilaFijaCercochapa.pieces, results.ventilaFijaCercochapa.measure)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-44"></span>
                    <span className="flex-1 text-right font-bold">
                      TRASLAPE: {formatMeasurement(results.ventilaFijaTraslape.pieces, results.ventilaFijaTraslape.measure)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <div className="flex">
                    <span className="w-44 text-lg font-medium">VENTILA CORREDIZA:</span>
                    <span className="flex-1 text-right font-bold">
                      CERCOCHAPA: {formatMeasurement(results.ventilaCorrCercochapa.pieces, results.ventilaCorrCercochapa.measure)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-44"></span>
                    <span className="flex-1 text-right font-bold">
                      TRASLAPE: {formatMeasurement(results.ventilaCorrTraslape.pieces, results.ventilaCorrTraslape.measure)}
                    </span>
                  </div>
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
                    { type: 'CERCO', measure: results.ventilaFijaCercochapa.measure, pieces: results.ventilaFijaCercochapa.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'CERCO', measure: results.ventilaCorrCercochapa.measure, pieces: results.ventilaCorrCercochapa.pieces, windowType: `Ventana ${nextWindowNumber}` },
                    { type: 'TRASLAPE', measure: results.ventilaFijaTraslape.measure, pieces: results.ventilaFijaTraslape.pieces, windowType: `Ventana ${nextWindowNumber}` },
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
                    const adjustmentValue = typeof glassAdjustment === 'string' ? 0 : glassAdjustment;

                    const glassesToAdd = [
                      {
                        windowNumber: nextWindowNumber,
                        windowType: '2 Fijos y 2 Corredizos - Línea 3',
                        calculatorType: 'two-fixed-two-sliding',
                        glassType: 'fija' as const,
                        width: glassMeasurements.width,
                        height: glassMeasurements.heightFija,
                        pieces: 2,
                        zocloUpper: zocloSelection.upper,
                        zocloLower: zocloSelection.lower,
                        adjustment: adjustmentValue
                      },
                      {
                        windowNumber: nextWindowNumber,
                        windowType: '2 Fijos y 2 Corredizos - Línea 3',
                        calculatorType: 'two-fixed-two-sliding',
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
        <TwoFixedTwoSlidingFormulaCustomizer
          onClose={() => setShowFormulaCustomizer(false)}
          onSave={handleSaveFormula}
        />
      )}

      {showGlassModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGlassModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
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
                <div className="bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white bg-orange-500 px-4 py-2 rounded-lg mb-4 text-center">
                    VENTILA FIJA
                  </h3>
                  <p className="text-gray-800 font-bold text-lg text-center">
                    2 pz de {glassMeasurements.width} cm x {glassMeasurements.heightFija} cm
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-400 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white bg-blue-500 px-4 py-2 rounded-lg mb-4 text-center">
                    VENTILA CORREDIZA
                  </h3>
                  <p className="text-gray-800 font-bold text-lg text-center">
                    2 pz de {glassMeasurements.width} cm x {glassMeasurements.heightCorrediza} cm
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Información de Perfiles:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Zócalo Superior: <span className="font-semibold">{zocloSelection.upper}</span></p>
                    <p>Zócalo Inferior: <span className="font-semibold">{zocloSelection.lower}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Por favor, ingrese las medidas primero.</p>
              </div>
            )}

            <button
              onClick={() => setShowGlassModal(false)}
              className="w-full mt-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}