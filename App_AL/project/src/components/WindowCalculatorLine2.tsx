import React, { useState } from 'react';
import { ArrowLeft, Settings, ChevronDown, ChevronUp, Check, X, HelpCircle } from 'lucide-react';
import { WindowCalculatorLine2FormulaCustomizer } from './WindowCalculatorLine2FormulaCustomizer';
import { WindowCalculatorLine2CuttingWorkflow } from './WindowCalculatorLine2CuttingWorkflow';
import { useSyncedState } from '../hooks/useSyncedState';
import { formatMeasurement } from '../hooks/formatMeasurement';
import { roundToDecimalString } from '../utils/roundDecimal';

interface WindowCalculatorLine2Props {
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

export function WindowCalculatorLine2({ onBack, onBackToNotes, initialWidth, initialHeight, showNotesButton = false }: WindowCalculatorLine2Props) {
  const [width, setWidth] = useSyncedState<string>('windowLine2Width', initialWidth || '');
  const [height, setHeight] = useSyncedState<string>('windowLine2Height', initialHeight || '');
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState(false);
  const [showCuttingWorkflow, setShowCuttingWorkflow] = useState(false);
  const [isZocloMenuOpen, setIsZocloMenuOpen] = useState(false);
  const [isCustomizingUpper, setIsCustomizingUpper] = useState(false);
  const [isCustomizingLower, setIsCustomizingLower] = useState(false);
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [showGlassHelpTooltip, setShowGlassHelpTooltip] = useState(false);
  const [glassAdjustment, setGlassAdjustment] = useSyncedState<number | ''>('windowLine2GlassAdjustment', 0);
  const [zocloSelection, setZocloSelection] = useSyncedState<ZocloSelection>('windowLine2Zoclo', {
    upper: 'ZOCLO 1V_L2',
    lower: 'ZOCLO 1V_L2'
  });
  const [formula, setFormula] = useSyncedState<Formula>('windowLine2Formula', {
    jambaVerticalHeight: 2.8,
    ventilaFijaHeight: 3.0,
    ventilaCorrHeight: 4.0,
    zocloWidth: 16.2,
  });

  const calculateMeasurements = () => {
    console.log('🔍 WindowCalculatorLine2 - calculateMeasurements ejecutado. Current width:', width, 'height:', height);
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    return {
      jambaVertical: { measure: (h - formula.jambaVerticalHeight).toFixed(1), pieces: 2 }, // 2 piezas
      jambaHorizontal: { measure: w.toFixed(1), pieces: 1 }, // 1 pieza
      riel: { measure: w.toFixed(1), pieces: 1 }, // 1 pieza
      ventilaFijaCercochapa: { measure: (h - formula.ventilaFijaHeight).toFixed(1), pieces: 1 }, // 1 pieza
      ventilaFijaTraslape: { measure: (h - formula.ventilaFijaHeight).toFixed(1), pieces: 1 }, // 1 pieza
      ventilaCorrCercochapa: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 1 }, // 1 pieza
      ventilaCorrTraslape: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 1 }, // 1 pieza
      zoclo: { measure: roundToDecimalString((w - formula.zocloWidth) / 2, 1), pieces: 4 }, // 4 piezas (2 superiores, 2 inferiores)
    };
  };

  const calculateGlassMeasurements = () => {
    const h = parseFloat(height);
    if (!h || !results) return null;

    const adjustmentValue = typeof glassAdjustment === 'number' ? glassAdjustment : 0;
    const upperZocloSize = zocloSelection.upper === 'ZOCLO 2V_L2' ? 7.5 : 3.7;
    const lowerZocloSize = zocloSelection.lower === 'ZOCLO 2V_L2' ? 7.5 : 3.7;

    const glassWidth = parseFloat(results.zoclo.measure) + adjustmentValue;
    const glassHeightFijo = h - formula.ventilaFijaHeight - upperZocloSize - lowerZocloSize + adjustmentValue;
    const glassHeightCorredizo = h - formula.ventilaCorrHeight - upperZocloSize - lowerZocloSize + adjustmentValue;

    return {
      fijo: {
        width: roundToDecimalString(glassWidth, 1),
        height: roundToDecimalString(glassHeightFijo, 1)
      },
      corredizo: {
        width: roundToDecimalString(glassWidth, 1),
        height: roundToDecimalString(glassHeightCorredizo, 1)
      }
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
    console.log('🔍 WindowCalculatorLine2 - useEffect ejecutado con:', {
      initialWidth,
      initialHeight,
      currentWidth: width,
      currentHeight: height,
      showNotesButton
    });

    // Si viene desde Notas, siempre actualizar las medidas (incluso si parecen iguales)
    if (showNotesButton && initialWidth !== undefined && initialHeight !== undefined) {
      console.log('🔍 WindowCalculatorLine2 - Forzando actualización desde Notas');
      if (initialWidth !== width) {
        console.log('🔍 WindowCalculatorLine2 - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight !== height) {
        console.log('🔍 WindowCalculatorLine2 - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    } else {
      // Comportamiento normal cuando no viene desde Notas
      if (initialWidth !== '' && initialWidth !== width) {
        console.log('🔍 WindowCalculatorLine2 - Actualizando width de', width, 'a', initialWidth);
        setWidth(initialWidth);
      }
      if (initialHeight !== '' && initialHeight !== height) {
        console.log('🔍 WindowCalculatorLine2 - Actualizando height de', height, 'a', initialHeight);
        setHeight(initialHeight);
      }
    }
  }, [initialWidth, initialHeight, showNotesButton]);

  const results = calculateMeasurements();

  if (showCuttingWorkflow && results) {
    return (
      <WindowCalculatorLine2CuttingWorkflow
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
            {['ZOCLO 1V_L2', 'ZOCLO 2V_L2', 'CABEZAL_L2'].map((profile) => {
              const displayName = profile.replace('_L2', '');
              return (
                <button
                  key={profile}
                  onClick={() => handleZocloSelect(
                    isCustomizingUpper ? 'upper' : 'lower',
                    profile
                  )}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 rounded"
                >
                  <span>{displayName}</span>
                  {((isCustomizingUpper && zocloSelection.upper === profile) ||
                    (isCustomizingLower && zocloSelection.lower === profile)) && (
                    <Check size={16} className="text-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2 pl-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Superior ({zocloSelection.upper.replace('_L2', '')}):</span>
          <div className="font-bold">{formatMeasurement(results?.zoclo.pieces / 2 || 0, results?.zoclo.measure || '')}</div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm">Inferior ({zocloSelection.lower.replace('_L2', '')}):</span>
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
        <h2 className="text-white text-3xl font-bold mt-2">FIJA CORREDIZA</h2>
        <h3 className="text-white text-xl font-bold mt-2">LÍNEA NACIONAL DE 2</h3>
      </div>

      <div className="w-full max-w-md">
        <div className="relative flex justify-center mb-8">
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
            className="absolute top-0 right-0 bg-yellow-400 text-[#003366] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-500 hover:scale-105 transition-all shadow-lg flex flex-col items-center leading-tight"
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
                  const nextWindowNumber = currentPieces.length > 0 ?
                    Math.max(...currentPieces.map((p: any) => parseInt(p.windowType.split(' ')[1] || '1'))) + 1 :
                    1;

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

                  const glassMeasurements = calculateGlassMeasurements();
                  if (glassMeasurements) {
                    const currentGlasses = JSON.parse(localStorage.getItem('packageGlasses') || '[]');
                    const adjustmentValue = typeof glassAdjustment === 'number' ? glassAdjustment : 0;

                    const glassesToAdd = [
                      {
                        windowNumber: nextWindowNumber,
                        windowType: 'Fijo Corredizo - Línea 2',
                        calculatorType: 'line2',
                        glassType: 'fija' as const,
                        width: glassMeasurements.fijo.width,
                        height: glassMeasurements.fijo.height,
                        pieces: 1,
                        zocloUpper: zocloSelection.upper.replace('_L2', ''),
                        zocloLower: zocloSelection.lower.replace('_L2', ''),
                        adjustment: adjustmentValue
                      },
                      {
                        windowNumber: nextWindowNumber,
                        windowType: 'Fijo Corredizo - Línea 2',
                        calculatorType: 'line2',
                        glassType: 'corrediza' as const,
                        width: glassMeasurements.corredizo.width,
                        height: glassMeasurements.corredizo.height,
                        pieces: 1,
                        zocloUpper: zocloSelection.upper.replace('_L2', ''),
                        zocloLower: zocloSelection.lower.replace('_L2', ''),
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
              
              {showNotesButton && (
                <button
                  onClick={() => {
                    if (onBackToNotes) {
                      onBackToNotes();
                    }
                  }}
                  className="w-full bg-indigo-500 text-white py-3 rounded-lg font-bold hover:bg-indigo-600 transition-colors mt-4"
                >
                  IR A NOTAS
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {showFormulaCustomizer && (
        <WindowCalculatorLine2FormulaCustomizer
          onClose={() => setShowFormulaCustomizer(false)}
          onSave={handleSaveFormula}
        />
      )}

      {showGlassModal && results && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowGlassModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-[#003366] mb-6 text-center">
              Contemplar Vidrios
            </h2>

            {(() => {
              const glassMeasurements = calculateGlassMeasurements();
              if (!glassMeasurements) return null;

              const adjustmentValue = typeof glassAdjustment === 'number' ? glassAdjustment : 0;

              return (
                <div className="space-y-6">
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

                  <div className="bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white bg-orange-500 px-4 py-2 rounded-lg mb-4 text-center">
                      VENTILA FIJA:
                    </h3>
                    <p className="text-gray-800 font-bold text-lg text-center">
                      1 pz de {glassMeasurements.fijo.width} cm x {glassMeasurements.fijo.height} cm
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-400 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white bg-blue-500 px-4 py-2 rounded-lg mb-4 text-center">
                      VENTILA CORREDIZA:
                    </h3>
                    <p className="text-gray-800 font-bold text-lg text-center">
                      1 pz de {glassMeasurements.corredizo.width} cm x {glassMeasurements.corredizo.height} cm
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Información de Perfiles:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Zócalo Superior: <span className="font-semibold">{zocloSelection.upper.replace('_L2', '')}</span></p>
                      <p>Zócalo Inferior: <span className="font-semibold">{zocloSelection.lower.replace('_L2', '')}</span></p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowGlassModal(false)}
                    className="w-full mt-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}