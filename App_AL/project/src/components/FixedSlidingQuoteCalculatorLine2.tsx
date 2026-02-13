import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, ChevronDown, ChevronUp, Check, X, HelpCircle } from 'lucide-react';
import { WindowCalculatorLine2FormulaCustomizer } from './WindowCalculatorLine2FormulaCustomizer';
import { useSyncedState } from '../hooks/useSyncedState';
import { formatMeasurement } from '../hooks/formatMeasurement';
import { HardwareSearchAndSelection } from './HardwareSearchAndSelection';
import { GlassSearchAndSelection } from './GlassSearchAndSelection';
import { getProfilePriceWithIVA } from '../utils/priceCalculations';
import { roundToDecimalString } from '../utils/roundDecimal';

interface FixedSlidingQuoteCalculatorLine2Props {
  onBack: () => void;
  onBackToNotes?: () => void;
  initialWidth?: string;
  initialHeight?: string;
  showNotesButton?: boolean;
}
// This is the correct formula customizer for Line 2 Fixed Sliding
interface Formula {
  jambaVerticalHeight: number;
  ventilaFijaHeight: number;
  ventilaCorrHeight: number;
  zocloWidth: number;
}

interface Profile {
  name: string;
  colors: {
    [key: string]: {
      price6m: string;
      pricePerM: string;
    };
  };
}

interface Hardware {
  name: string;
  pricePerPackage: string;
  pricePerPiece: string;
}

interface SelectedHardware {
  name: string;
  quantity: number;
  price: number;
  total: number;
  chargingMethod: 'package' | 'piece';
  pricePerPackage: number;
  pricePerPiece: number;
}

interface Glass {
  name: string;
  pricePerPiece: string;
  pricePerM2: string;
}

interface SelectedGlass {
  name: string;
  quantity: number;
  price: number;
  total: number;
  chargingMethod: 'piece' | 'm2';
  pricePerPiece: number;
  pricePerM2: number;
  id?: string;
}

const AVAILABLE_COLORS = [
  'Blanco',
  'Negro',
  'Natural',
  'Natural Brillante',
  'Champagne Mate',
  'Champagne Brillante',
  'Madera',
  'Madera Nogal Texturizado',
  'Gris Europa',
  'Bronce Oscuro'
];

export function FixedSlidingQuoteCalculatorLine2({ onBack, onBackToNotes, initialWidth, initialHeight, showNotesButton = false }: FixedSlidingQuoteCalculatorLine2Props) {
  console.log('🔍 FixedSlidingQuoteCalculatorLine2 - Componente renderizado. Prop showNotesButton:', showNotesButton);

  const [width, setWidth] = useSyncedState<string>('fixedSlidingLine2QuoteWidth', initialWidth || '');
  const [height, setHeight] = useSyncedState<string>('fixedSlidingLine2QuoteHeight', initialHeight || '');
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState(false);
  const [showMethodSelectionModal, setShowMethodSelectionModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<'top' | 'bottom'>('top');
  const [formula, setFormula] = useSyncedState<Formula>('fixedSlidingLine2QuoteFormula', {
    jambaVerticalHeight: 2.8,
    ventilaFijaHeight: 3.0,
    ventilaCorrHeight: 4.0,
    zocloWidth: 16.2,
  });
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const savedColor = localStorage.getItem('selectedColor');
    return savedColor || AVAILABLE_COLORS[0];
  });
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [glass, setGlass] = useState<Glass[]>([]);

  const initialPropsAppliedRef = React.useRef(false);

  // Estado para el porcentaje de IVA
  const [materialIvaPercentage] = useSyncedState<number>('materialIvaPercentage', 16);

  // Estado para herrajes seleccionados
  const [selectedHardware, setSelectedHardware] = useState<SelectedHardware[]>(() => {
    const savedHardware = localStorage.getItem('selectedFixedSlidingLine2Hardware');
    if (savedHardware) {
      try {
        return JSON.parse(savedHardware);
      } catch (error) {
        console.error('Error loading hardware:', error);
        return [];
      }
    }
    return [];
  });

  // Estado para vidrios seleccionados
  const [selectedGlass, setSelectedGlass] = useState<SelectedGlass[]>(() => {
    const savedGlass = localStorage.getItem('selectedFixedSlidingLine2Glass');
    if (savedGlass) {
      try {
        return JSON.parse(savedGlass);
      } catch (error) {
        console.error('Error loading glass:', error);
        return [];
      }
    }
    return [];
  });

  // Estados para modal de vidrios
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [showGlassHelpTooltip, setShowGlassHelpTooltip] = useState(false);
  const [glassAdjustment, setGlassAdjustment] = useSyncedState<number | ''>('fixedSlidingLine2GlassAdjustment', 2);

  // Estado para zoclo selection con persistencia
  const [zocloSelection, setZocloSelection] = useSyncedState<{upper: string; lower: string}>('fixedSlidingLine2QuoteZoclo', {
    upper: 'ZOCLO 1V_L2',
    lower: 'ZOCLO 1V_L2'
  });
  const [isZocloMenuOpen, setIsZocloMenuOpen] = useState(false);
  const [isCustomizingUpper, setIsCustomizingUpper] = useState(false);
  const [isCustomizingLower, setIsCustomizingLower] = useState(false);

  // Función para manejar selección de zoclo
  const handleZocloSelect = (position: 'upper' | 'lower', profile: string) => {
    setZocloSelection(prev => ({
      ...prev,
      [position]: profile
    }));
    setIsCustomizingUpper(false);
    setIsCustomizingLower(false);
    setIsZocloMenuOpen(false);
  };

  // Efecto para manejar medidas iniciales desde Notas
  React.useEffect(() => {
    if (initialPropsAppliedRef.current) {
      return;
    }

    console.log('🔍 FixedSlidingQuoteCalculatorLine2 - useEffect ejecutado con:', {
      initialWidth,
      initialHeight,
      currentWidth: width,
      currentHeight: height,
      showNotesButton
    });

    if (initialWidth && initialWidth.trim() !== '') {
      console.log('🔍 FixedSlidingQuoteCalculatorLine2 - Actualizando width a', initialWidth);
      setWidth(initialWidth);
    }
    if (initialHeight && initialHeight.trim() !== '') {
      console.log('🔍 FixedSlidingQuoteCalculatorLine2 - Actualizando height a', initialHeight);
      setHeight(initialHeight);
    }

    if (initialWidth || initialHeight) {
      initialPropsAppliedRef.current = true;
    }
  }, [initialWidth, initialHeight, setWidth, setHeight]);

  useEffect(() => {
    const savedProfiles = localStorage.getItem('windowProfiles');
    if (savedProfiles) {
      try {
        const parsedProfiles = JSON.parse(savedProfiles);
        setProfiles(parsedProfiles);
      } catch (error) {
        console.error('Error loading profiles:', error);
        setProfiles([]);
      }
    }

    const savedHardware = localStorage.getItem('windowHardware');
    if (savedHardware) {
      try {
        const parsedHardware = JSON.parse(savedHardware);
        setHardware(parsedHardware);
      } catch (error) {
        console.error('Error loading hardware:', error);
        setHardware([]);
      }
    }

    const savedGlass = localStorage.getItem('windowGlass');
    if (savedGlass) {
      try {
        const parsedGlass = JSON.parse(savedGlass);
        setGlass(parsedGlass);
      } catch (error) {
        console.error('Error loading glass:', error);
        setGlass([]);
      }
    }
  }, []);

  // Guardar herrajes seleccionados en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('selectedFixedSlidingLine2Hardware', JSON.stringify(selectedHardware));
  }, [selectedHardware]);

  // Guardar vidrios seleccionados en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('selectedFixedSlidingLine2Glass', JSON.stringify(selectedGlass));
  }, [selectedGlass]);

  // Función para detectar la posición del scroll y determinar dónde mostrar el modal
  const determineModalPosition = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Si el usuario está en la mitad inferior de la página, mostrar modal abajo
    // Si está en la mitad superior, mostrar modal arriba
    const scrollPercentage = scrollTop / (documentHeight - windowHeight);
    
    return scrollPercentage > 0.5 ? 'bottom' : 'top';
  };

  const handleShowMethodModal = () => {
    const position = determineModalPosition();
    setModalPosition(position);
    setShowMethodSelectionModal(true);
  };

  const getProfilePrice = (name: string): { price6m: number; pricePerM: number } => {
    return getProfilePriceWithIVA(name, selectedColor, profiles, materialIvaPercentage);
  };

  const calculateGlassMeasurements = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    const zocloMeasurements: { [key: string]: number } = {
      'ZOCLO 1V_L2': 3.7,
      'ZOCLO 2V_L2': 7.5,
      'CABEZAL_L2': 3.7,
    };

    const upperZoclo = zocloMeasurements[zocloSelection.upper] || 3.7;
    const lowerZoclo = zocloMeasurements[zocloSelection.lower] || 3.7;

    const adjustment = typeof glassAdjustment === 'number' ? glassAdjustment : 0;
    const zocloMeasure = roundToDecimalString((w - formula.zocloWidth) / 2, 1);
    const glassWidth = parseFloat(zocloMeasure) + adjustment;
    const glassHeightFija = h - formula.ventilaFijaHeight - upperZoclo - lowerZoclo + adjustment;
    const glassHeightCorrediza = h - formula.ventilaCorrHeight - upperZoclo - lowerZoclo + adjustment;

    return {
      fija: {
        width: glassWidth.toFixed(1),
        height: glassHeightFija.toFixed(1)
      },
      corrediza: {
        width: glassWidth.toFixed(1),
        height: glassHeightCorrediza.toFixed(1)
      }
    };
  };

  const calculateSquareMeters = () => {
    const glassMeasurements = calculateGlassMeasurements();
    if (!glassMeasurements) return null;

    const widthInMeters = parseFloat(glassMeasurements.fija.width) / 100;
    const heightFijaInMeters = parseFloat(glassMeasurements.fija.height) / 100;
    const heightCorrInMeters = parseFloat(glassMeasurements.corrediza.height) / 100;

    const areaFija = widthInMeters * heightFijaInMeters;
    const areaCorr = widthInMeters * heightCorrInMeters;
    const totalArea = areaFija + areaCorr;

    return {
      area: areaFija,
      totalArea: totalArea,
      pieces: 2
    };
  };

  const calculateMeasurements = () => {
    console.log('🔍 FixedSlidingQuoteCalculatorLine2 - calculateMeasurements ejecutado');
    console.log('🔍 Estados actuales - width:', width, 'height:', height);
    const w = parseFloat(width);
    const h = parseFloat(height);
    console.log('🔍 Valores parseados - w:', w, 'h:', h);
    
    if (!w || !h) {
      console.log('🔍 Retornando null porque w o h son falsy - w:', w, 'h:', h);
      return null;
    }

    console.log('🔍 Procediendo con cálculos...');

    const measurements = {
      jambaVertical: { measure: (h - formula.jambaVerticalHeight).toFixed(1), pieces: 2 },
      jambaHorizontal: { measure: w.toFixed(1), pieces: 1 },
      riel: { measure: w.toFixed(1), pieces: 1 },
      ventilaFijaCercochapa: { measure: (h - formula.ventilaFijaHeight).toFixed(1), pieces: 1 },
      ventilaFijaTraslape: { measure: (h - formula.ventilaFijaHeight).toFixed(1), pieces: 1 },
      ventilaCorrCercochapa: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 1 },
      ventilaCorrTraslape: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 1 },
      zoclo: { measure: roundToDecimalString((w - formula.zocloWidth) / 2, 1), pieces: 4 },
    };

    // Get profile prices
    const jambaPrice = getProfilePrice('JAMBA_L2');
    const rielPrice = getProfilePrice('RIEL_L2');
    const cercoPrice = getProfilePrice('CERCO_L2');
    const trasPrice = getProfilePrice('TRASLAPE_L2');

    // NEW: Get specific zoclo prices based on selection
    const upperZocloPrice = getProfilePrice(zocloSelection.upper);
    const lowerZocloPrice = getProfilePrice(zocloSelection.lower);

    // Calculate total lengths in meters
    const jambaTotal = (parseFloat(measurements.jambaVertical.measure) * measurements.jambaVertical.pieces + 
                      parseFloat(measurements.jambaHorizontal.measure) * measurements.jambaHorizontal.pieces) / 100;
    const rielTotal = (parseFloat(measurements.riel.measure) * measurements.riel.pieces) / 100;
    const cercoChapaTotal = (parseFloat(measurements.ventilaFijaCercochapa.measure) + 
                           parseFloat(measurements.ventilaCorrCercochapa.measure)) / 100;
    const trasTotal = (parseFloat(measurements.ventilaFijaTraslape.measure) + 
                     parseFloat(measurements.ventilaCorrTraslape.measure)) / 100;
    // NEW: Calculate zoclo lengths separately for upper and lower
    const zocloUpperTotal = (parseFloat(measurements.zoclo.measure) * 2) / 100; // 2 pieces for upper
    const zocloLowerTotal = (parseFloat(measurements.zoclo.measure) * 2) / 100; // 2 pieces for lower

    // Calculate costs per fraction (using price per meter)
    const fractionCosts = {
      jamba: {
        totalLength: (jambaTotal * 100).toFixed(1),
        cost: (jambaTotal * jambaPrice.pricePerM).toFixed(2)
      },
      riel: {
        totalLength: (rielTotal * 100).toFixed(1),
        cost: (rielTotal * rielPrice.pricePerM).toFixed(2)
      },
      cercochapa: {
        totalLength: (cercoChapaTotal * 100).toFixed(1),
        cost: (cercoChapaTotal * cercoPrice.pricePerM).toFixed(2)
      },
      traslape: {
        totalLength: (trasTotal * 100).toFixed(1),
        cost: (trasTotal * trasPrice.pricePerM).toFixed(2)
      },
      // NEW: Zoclo costs per fraction
      zocloUpper: {
        totalLength: (zocloUpperTotal * 100).toFixed(1),
        cost: (zocloUpperTotal * upperZocloPrice.pricePerM).toFixed(2)
      },
      zocloLower: {
        totalLength: (zocloLowerTotal * 100).toFixed(1),
        cost: (zocloLowerTotal * lowerZocloPrice.pricePerM).toFixed(2)
      }
    };

    // Calculate gross costs (using price per 6m piece)
    const grossCosts = {
      jamba: {
        pieces: Math.ceil(jambaTotal / 6),
        cost: (Math.ceil(jambaTotal / 6) * jambaPrice.price6m).toFixed(2)
      },
      riel: {
        pieces: Math.ceil(rielTotal / 6),
        cost: (Math.ceil(rielTotal / 6) * rielPrice.price6m).toFixed(2)
      },
      cercochapa: {
        pieces: Math.ceil(cercoChapaTotal / 6),
        cost: (Math.ceil(cercoChapaTotal / 6) * cercoPrice.price6m).toFixed(2)
      },
      traslape: {
        pieces: Math.ceil(trasTotal / 6),
        cost: (Math.ceil(trasTotal / 6) * trasPrice.price6m).toFixed(2)
      },
    };

    // NEW: Calculate zoclo gross costs
    const zocloPieces = Math.ceil((zocloUpperTotal + zocloLowerTotal) / 6);
    const zocloCost = zocloSelection.upper === zocloSelection.lower
      ? {
          pieces: zocloPieces,
          cost: (zocloPieces * upperZocloPrice.price6m).toFixed(2)
        }
      : {
          upper: {
            pieces: Math.ceil(zocloUpperTotal / 6),
            cost: (Math.ceil(zocloUpperTotal / 6) * upperZocloPrice.price6m).toFixed(2)
          },
          lower: {
            pieces: Math.ceil(zocloLowerTotal / 6),
            cost: (Math.ceil(zocloLowerTotal / 6) * lowerZocloPrice.price6m).toFixed(2)
          }
        };

    return {
      // ... (existing return)
      measurements,
      fractionCosts,
      grossCosts,
      zocloCost // Add zocloCost to the returned object
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

  const handleAddToPackage = (method: 'fraction' | 'gross') => {
    if (!results) return;

    // Preparar los herrajes para incluirlos en el paquete
    const additionalHardwareItems = selectedHardware.map(item => ({
      name: item.name,
      pieces: item.quantity,
      cost: item.total,
      chargingMethod: item.chargingMethod
    }));

    // Preparar los vidrios para incluirlos en el paquete
    const additionalGlassItems = selectedGlass.map(item => ({
      name: item.name,
      pieces: item.quantity,
      cost: item.total,
      chargingMethod: item.chargingMethod
    }));

    const windowData = {
      id: crypto.randomUUID(),
      type: 'Fija Corrediza',
      line: 'Línea Nacional de 2',
      width,
      height,
      color: selectedColor,
      date: new Date().toISOString(),
      method,
      zocloConfig: {
        upper: zocloSelection.upper,
        lower: zocloSelection.lower
      },
      profiles: method === 'fraction' ? [
        { name: 'JAMBA_L2', totalLength: parseFloat(results.fractionCosts.jamba.totalLength), cost: parseFloat(results.fractionCosts.jamba.cost) },
        { name: 'RIEL_L2', totalLength: parseFloat(results.fractionCosts.riel.totalLength), cost: parseFloat(results.fractionCosts.riel.cost) },
        { name: 'CERCO_L2', totalLength: parseFloat(results.fractionCosts.cercochapa.totalLength), cost: parseFloat(results.fractionCosts.cercochapa.cost) },
        { name: 'TRASLAPE_L2', totalLength: parseFloat(results.fractionCosts.traslape.totalLength), cost: parseFloat(results.fractionCosts.traslape.cost) },
        { name: zocloSelection.upper, totalLength: parseFloat(results.fractionCosts.zocloUpper.totalLength), cost: parseFloat(results.fractionCosts.zocloUpper.cost), zocloPosition: 'superior' },
        { name: zocloSelection.lower, totalLength: parseFloat(results.fractionCosts.zocloLower.totalLength), cost: parseFloat(results.fractionCosts.zocloLower.cost), zocloPosition: 'inferior' }
      ] : [
        { name: 'JAMBA_L2', totalLength: results.grossCosts.jamba.pieces * 600, cost: parseFloat(results.grossCosts.jamba.cost) },
        { name: 'RIEL_L2', totalLength: results.grossCosts.riel.pieces * 600, cost: parseFloat(results.grossCosts.riel.cost) },
        { name: 'CERCO_L2', totalLength: results.grossCosts.cercochapa.pieces * 600, cost: parseFloat(results.grossCosts.cercochapa.cost) },
        { name: 'TRASLAPE_L2', totalLength: results.grossCosts.traslape.pieces * 600, cost: parseFloat(results.grossCosts.traslape.cost) },
        { name: zocloSelection.upper, totalLength: parseFloat(results.fractionCosts.zocloUpper.totalLength), cost: parseFloat(results.fractionCosts.zocloUpper.cost), zocloPosition: 'superior' },
        { name: zocloSelection.lower, totalLength: parseFloat(results.fractionCosts.zocloLower.totalLength), cost: parseFloat(results.fractionCosts.zocloLower.cost), zocloPosition: 'inferior' }
      ],
      hardware: additionalHardwareItems,
      glass: additionalGlassItems,
      totalCost: method === 'fraction' ? totalFractionCost : totalGrossCost
    };

    const existingPackage = JSON.parse(localStorage.getItem('quotedWindowsPackage') || '[]');
    existingPackage.push(windowData);
    localStorage.setItem('quotedWindowsPackage', JSON.stringify(existingPackage));
    
    setShowMethodSelectionModal(false);
    alert('¡Ventana agregada al paquete cotizado!');
  };

  const results = calculateMeasurements();

  // Calcular el costo total de los herrajes
  const additionalHardwareCost = selectedHardware.reduce((sum, item) => sum + item.total, 0);

  // Calcular el costo total de los vidrios
  const additionalGlassCost = selectedGlass.reduce((sum, item) => sum + item.total, 0);

  const totalFractionCost = results ?
    parseFloat(results.fractionCosts.jamba.cost) +
    parseFloat(results.fractionCosts.riel.cost) +
    parseFloat(results.fractionCosts.cercochapa.cost) +
    parseFloat(results.fractionCosts.traslape.cost) +
    parseFloat(results.fractionCosts.zocloUpper.cost) +
    parseFloat(results.fractionCosts.zocloLower.cost) +
    additionalHardwareCost +
    additionalGlassCost : 0;

  const totalGrossCost = results ?
    parseFloat(results.grossCosts.jamba.cost) +
    parseFloat(results.grossCosts.riel.cost) +
    parseFloat(results.grossCosts.cercochapa.cost) +
    parseFloat(results.grossCosts.traslape.cost) +
    ('pieces' in results.zocloCost ?
      parseFloat(results.zocloCost.cost) :
      parseFloat(results.zocloCost.upper.cost) + parseFloat(results.zocloCost.lower.cost)) +
    additionalHardwareCost +
    additionalGlassCost : 0;

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center px-4 animate-fade-in">
      {/* Method Selection Modal - Smart positioning */}
      {showMethodSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className={`absolute ${modalPosition === 'top' ? 'top-4' : 'bottom-4'} left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl w-full max-w-md mx-4`}>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-[#003366] mb-4 text-center">
                Seleccionar Método de Cotización
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                ¿Cómo deseas agregar esta ventana al paquete cotizado?
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleAddToPackage('fraction')}
                  className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg font-bold hover:bg-blue-600 transition-colors flex flex-col items-center"
                >
                  <span className="text-lg">Agregar por Fracción</span>
                  <span className="text-sm opacity-90 mt-1">Costo exacto según medidas</span>
                </button>
                
                <button
                  onClick={() => handleAddToPackage('gross')}
                  className="w-full bg-green-500 text-white py-4 px-6 rounded-lg font-bold hover:bg-green-600 transition-colors flex flex-col items-center"
                >
                  <span className="text-lg">Agregar por Bruto</span>
                  <span className="text-sm opacity-90 mt-1">Piezas completas de 6m</span>
                </button>
                
                <button
                  onClick={() => setShowMethodSelectionModal(false)}
                  className="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full pt-6 px-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver al menú anterior"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-4">
          <div className="relative">
            <button
              onClick={() => setShowColorMenu(!showColorMenu)}
              className="flex items-center gap-2 bg-white text-[#003366] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span>{selectedColor}</span>
              {showColorMenu ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showColorMenu && (
              <div className="absolute right-0 sm:right-0 left-0 sm:left-auto z-10 mt-1 w-full sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      localStorage.setItem('selectedColor', color);
                      setShowColorMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[#003366] flex items-center justify-between"
                  >
                    <span>{color}</span>
                    {selectedColor === color && <Check size={16} className="text-green-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFormulaCustomizer(true)}
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
          >
            <Settings size={24} />
            <span>Personalizar Fórmula</span>
          </button>
        </div>
      </div>

      <div className="text-center my-8">
        <h1 className="text-white text-5xl font-bold">VENTANA</h1>
        <h2 className="text-white text-3xl font-bold mt-2">FIJA CORREDIZA</h2>
        <h3 className="text-white text-xl font-bold mt-2">LÍNEA NACIONAL DE 2</h3>
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
            className="absolute top-0 right-0 bg-yellow-400 text-black px-3 py-1 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-all hover:scale-110 shadow-lg"
            style={{ fontSize: '10px', lineHeight: '1.2' }}
          >
            <div>Contemplar</div>
            <div>Vidrio</div>
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
                onChange={(e) => {
                  console.log('🔍 Input ANCHO cambiado a:', e.target.value);
                  setWidth(e.target.value);
                }}
                className="w-full px-4 py-2 rounded-lg text-center text-xl"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-white text-lg mb-2">ALTO</label>
              <input
                type="number"
                value={height}
                onChange={(e) => {
                  console.log('🔍 Input ALTO cambiado a:', e.target.value);
                  setHeight(e.target.value);
                }}
                className="w-full px-4 py-2 rounded-lg text-center text-xl"
                placeholder="0.0"
              />
            </div>
          </div>
        </div>

        {results && (
          console.log('🔍 Renderizando resultados:', results) || 
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-[#003366] mb-4">COSTO POR FRACCIÓN</h3>
              <div className="space-y-4 text-[#003366]">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">JAMBA TOTAL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.fractionCosts.jamba.totalLength} CM</div>
                    <div className="text-sm text-gray-600">${results.fractionCosts.jamba.cost}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">RIEL TOTAL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.fractionCosts.riel.totalLength} CM</div>
                    <div className="text-sm text-gray-600">${results.fractionCosts.riel.cost}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">CERCOCHAPA TOTAL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.fractionCosts.cercochapa.totalLength} CM</div>
                    <div className="text-sm text-gray-600">${results.fractionCosts.cercochapa.cost}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">TRASLAPE TOTAL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.fractionCosts.traslape.totalLength} CM</div>
                    <div className="text-sm text-gray-600">${results.fractionCosts.traslape.cost}</div>
                  </div>
                </div>

                {/* NEW: Zoclo dropdown for fraction costs */}
                <div className="relative border-b border-gray-200 pb-2">
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

                  <div className="mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Superior ({zocloSelection.upper.replace('_L2', '')}):</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatMeasurement(2, results?.measurements.zoclo.measure || '0.0')}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${results?.fractionCosts.zocloUpper.cost || '0.00'}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">Inferior ({zocloSelection.lower.replace('_L2', '')}):</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatMeasurement(2, results?.measurements.zoclo.measure || '0.0')}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${results?.fractionCosts.zocloLower.cost || '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de herrajes */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <HardwareSearchAndSelection
                    hardware={hardware}
                    selectedHardware={selectedHardware}
                    onSelectedHardwareChange={setSelectedHardware}
                    lineType="all"
                  />
                </div>

                {/* Sección de vidrios */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <GlassSearchAndSelection
                    glass={glass}
                    selectedGlass={selectedGlass}
                    onSelectedGlassChange={setSelectedGlass}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <span className="text-xl font-bold">COSTO TOTAL:</span>
                  <span className="text-xl font-bold">${totalFractionCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-[#003366] mb-4">COSTO BRUTO (PIEZAS COMPLETAS)</h3>
              <div className="space-y-4 text-[#003366]">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">JAMBA:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.grossCosts.jamba.pieces} PIEZA{results.grossCosts.jamba.pieces > 1 ? 'S' : ''} DE 6M</div>
                    <div className="text-sm text-gray-600">${results.grossCosts.jamba.cost}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">RIEL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.grossCosts.riel.pieces} PIEZA{results.grossCosts.riel.pieces > 1 ? 'S' : ''} DE 6M</div>
                    <div className="text-sm text-gray-600">${results.grossCosts.riel.cost}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">CERCOCHAPA:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.grossCosts.cercochapa.pieces} PIEZA{results.grossCosts.cercochapa.pieces > 1 ? 'S' : ''} DE 6M</div>
                    <div className="text-sm text-gray-600">${results.grossCosts.cercochapa.cost}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">TRASLAPE:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.grossCosts.traslape.pieces} PIEZA{results.grossCosts.traslape.pieces > 1 ? 'S' : ''} DE 6M</div>
                    <div className="text-sm text-gray-600">${results.grossCosts.traslape.cost}</div>
                  </div>
                </div>

                {/* NEW: Zoclo gross costs display */}
                <div className="border-b border-gray-200 pb-2">
                  <div className="text-lg font-medium mb-2">ZOCLO:</div>
                  {zocloSelection.upper === zocloSelection.lower ? (
                    <div className="pl-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{zocloSelection.upper.replace('_L2', '')}:</span>
                        <div className="text-right">
                          <div className="font-bold">{results.zocloCost.pieces} PIEZA{results.zocloCost.pieces > 1 ? 'S' : ''} DE 6M</div>
                          <div className="text-sm text-gray-600">${results.zocloCost.cost}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{zocloSelection.upper.replace('_L2', '')}:</span>
                        <div className="text-right">
                          <div className="font-bold">{results.zocloCost.upper.pieces} PIEZA{results.zocloCost.upper.pieces > 1 ? 'S' : ''} DE 6M</div>
                          <div className="text-sm text-gray-600">${results.zocloCost.upper.cost}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">{zocloSelection.lower.replace('_L2', '')}:</span>
                        <div className="text-right">
                          <div className="font-bold">{results.zocloCost.lower.pieces} PIEZA{results.zocloCost.lower.pieces > 1 ? 'S' : ''} DE 6M</div>
                          <div className="text-sm text-gray-600">${results.zocloCost.lower.cost}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedHardware.length > 0 && (
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-lg font-medium mb-2">HERRAJES:</div>
                    <div className="pl-4">
                      {selectedHardware.map((item, index) => (
                        <div key={index} className="flex justify-between items-center mt-1">
                          <span className="text-sm">{item.name}:</span>
                          <div className="text-right">
                            <div className="font-bold">{item.quantity} PIEZA{item.quantity > 1 ? 'S' : ''}</div>
                            <div className="text-sm text-gray-600">${item.total.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGlass.length > 0 && (
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-lg font-medium mb-2">VIDRIOS:</div>
                    <div className="pl-4">
                      {selectedGlass.map((item, index) => (
                        <div key={index} className="flex justify-between items-center mt-1">
                          <span className="text-sm">{item.name}:</span>
                          <div className="text-right">
                            <div className="font-bold">{item.quantity} {item.chargingMethod === 'm2' ? 'M²' : 'PIEZA' + (item.quantity > 1 ? 'S' : '')}</div>
                            <div className="text-sm text-gray-600">${item.total.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <span className="text-xl font-bold">COSTO TOTAL BRUTO:</span>
                  <span className="text-xl font-bold">${totalGrossCost.toFixed(2)}</span>
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
                  if (!results) {
                    alert('Por favor, ingrese las medidas primero');
                    return;
                  }
                  handleShowMethodModal();
                }}
                className={`w-full py-3 rounded-lg font-bold ${
                  !results ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
                } text-white`}
              >
                AGREGAR A PAQUETE COTIZADO
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

      {showGlassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#003366]">Contemplar Vidrios</h3>
              <button
                onClick={() => setShowGlassModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-lg font-bold text-green-800">Ajuste de Aumento de Vidrio</h4>
                  <div className="relative">
                    <button
                      onClick={() => setShowGlassHelpTooltip(!showGlassHelpTooltip)}
                      className="text-green-600 hover:text-green-700 transition-colors"
                      type="button"
                    >
                      <HelpCircle size={20} />
                    </button>
                    {showGlassHelpTooltip && (
                      <div className="absolute right-0 top-8 z-50 w-64 bg-blue-600 text-white p-4 rounded-lg shadow-xl">
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
                <div className="flex items-center gap-4">
                  <label className="text-green-700 font-medium">Aumento (cm):</label>
                  <input
                    type="number"
                    value={glassAdjustment}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setGlassAdjustment('');
                      } else {
                        setGlassAdjustment(parseFloat(val) || 0);
                      }
                    }}
                    className="w-24 px-3 py-2 border border-green-300 rounded-lg text-center font-bold"
                    step="0.1"
                  />
                  <button
                    onClick={() => setGlassAdjustment(2)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
                  >
                    Restablecer
                  </button>
                </div>
              </div>

              {calculateGlassMeasurements() && (
                <>
                  <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-blue-800 mb-3">VENTILA FIJA</h4>
                    <div className="bg-white rounded p-3">
                      <p className="text-blue-900 font-bold">
                        1 pz de {calculateGlassMeasurements()?.fija.width} x {calculateGlassMeasurements()?.fija.height} cm
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-blue-800 mb-3">VENTILA CORREDIZA</h4>
                    <div className="bg-white rounded p-3">
                      <p className="text-blue-900 font-bold">
                        1 pz de {calculateGlassMeasurements()?.corrediza.width} x {calculateGlassMeasurements()?.corrediza.height} cm
                      </p>
                    </div>
                  </div>

                  {calculateSquareMeters() && (
                    <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-purple-800 mb-2">Metros Cuadrados Totales</h4>
                      <p className="text-3xl font-bold text-purple-900">
                        {calculateSquareMeters()?.totalArea.toFixed(2)} m²
                      </p>
                      <p className="text-sm text-purple-600 mt-1">
                        Para {calculateSquareMeters()?.pieces} vidrios
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <h4 className="text-md font-bold text-gray-800 mb-3">Información de Perfiles</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span className="font-medium">Perfil Superior:</span>
                        <span className="font-bold">{zocloSelection.upper.replace('_L2', '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Perfil Inferior:</span>
                        <span className="font-bold">{zocloSelection.lower.replace('_L2', '')}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowGlassModal(false)}
                className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold hover:bg-[#004488] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormulaCustomizer && (
        <WindowCalculatorLine2FormulaCustomizer
          onClose={() => setShowFormulaCustomizer(false)}
          onSave={handleSaveFormula}
        />
      )}
    </div>
  );
}