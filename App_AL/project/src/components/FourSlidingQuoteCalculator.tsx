import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, ChevronDown, ChevronUp, Check, X, HelpCircle } from 'lucide-react';
import { FourSlidingFormulaCustomizer } from './FourSlidingFormulaCustomizer';
import { useSyncedState } from '../hooks/useSyncedState';
import { formatMeasurement } from '../hooks/formatMeasurement';
import { HardwareSearchAndSelection } from './HardwareSearchAndSelection';
import { GlassSearchAndSelection } from './GlassSearchAndSelection';
import { getProfilePriceWithIVA } from '../utils/priceCalculations';
import { roundToDecimalString } from '../utils/roundDecimal';

interface FourSlidingQuoteCalculatorProps {
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

export function FourSlidingQuoteCalculator({ onBack, onBackToNotes, initialWidth, initialHeight, showNotesButton = false }: FourSlidingQuoteCalculatorProps) {
  console.log('🔍 FourSlidingQuoteCalculator - Componente renderizado. Prop showNotesButton:', showNotesButton);

  const [width, setWidth] = useSyncedState<string>('fourSlidingQuoteWidth', initialWidth || '');
  const [height, setHeight] = useSyncedState<string>('fourSlidingQuoteHeight', initialHeight || '');
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState(false);
  const [showMethodSelectionModal, setShowMethodSelectionModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<'top' | 'bottom'>('top');
  const [isZocloMenuOpen, setIsZocloMenuOpen] = useState(false);
  const [isCustomizingUpper, setIsCustomizingUpper] = useState(false);
  const [isCustomizingLower, setIsCustomizingLower] = useState(false);
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [showGlassHelpTooltip, setShowGlassHelpTooltip] = useState(false);
  const [glassAdjustment, setGlassAdjustment] = useSyncedState<number | string>('fourSlidingQuoteGlassAdjustment', 2);
  const [zocloSelection, setZocloSelection] = useSyncedState<ZocloSelection>('fourSlidingQuoteZoclo', {
    upper: 'ZOCLO 1V_L3',
    lower: 'ZOCLO 1V_L3'
  });
  const [formula, setFormula] = useSyncedState<Formula>('fourSlidingQuoteFormula', {
    jambaVerticalHeight: 2.7,
    ventilaCorrHeight: 3.7,
    rielAdicionalWidth: 2.7,
    zocloWidth: 34,
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
    const savedHardware = localStorage.getItem('selectedFourSlidingHardware');
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
    const savedGlass = localStorage.getItem('selectedFourSlidingGlass');
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

  // Efecto para manejar medidas iniciales desde Notas
  React.useEffect(() => {
    if (initialPropsAppliedRef.current) {
      return;
    }

    console.log('🔍 FourSlidingQuoteCalculator - useEffect ejecutado con:', {
      initialWidth,
      initialHeight,
      currentWidth: width,
      currentHeight: height,
      showNotesButton
    });

    if (initialWidth && initialWidth.trim() !== '') {
      console.log('🔍 FourSlidingQuoteCalculator - Actualizando width a', initialWidth);
      setWidth(initialWidth);
    }
    if (initialHeight && initialHeight.trim() !== '') {
      console.log('🔍 FourSlidingQuoteCalculator - Actualizando height a', initialHeight);
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
    localStorage.setItem('selectedFourSlidingHardware', JSON.stringify(selectedHardware));
  }, [selectedHardware]);

  // Guardar vidrios seleccionados en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('selectedFourSlidingGlass', JSON.stringify(selectedGlass));
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
    // Add _L3 suffix if not already present
    const profileName = name.includes('_L3') ? name : `${name}_L3`;
    return getProfilePriceWithIVA(profileName, selectedColor, profiles, materialIvaPercentage);
  };

  const calculateMeasurements = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    
    if (!w || !h) return null;

    const measurements = {
      jambaVertical: { measure: (h - formula.jambaVerticalHeight).toFixed(1), pieces: 2 },
      jambaHorizontal: { measure: w.toFixed(1), pieces: 1 },
      riel: { measure: w.toFixed(1), pieces: 1 },
      rielAdicional: { measure: (w - formula.rielAdicionalWidth).toFixed(1), pieces: 1 },
      ventilaCorrCercochapa: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 4 },
      ventilaCorrTraslape: { measure: (h - formula.ventilaCorrHeight).toFixed(1), pieces: 4 },
      zoclo: { measure: roundToDecimalString((w - formula.zocloWidth) / 4, 1), pieces: 8 },
    };

    // Get profile prices
    const jambaPrice = getProfilePrice('JAMBA_L3');
    const rielPrice = getProfilePrice('RIEL_L3');
     const rielAdicionalPrice = getProfilePrice('RIEL ADICIONAL_L3');
    const cercoPrice = getProfilePrice('CERCO_L3');
    const trasPrice = getProfilePrice('TRASLAPE_L3');
    const upperZocloPrice = getProfilePrice(zocloSelection.upper);
    const lowerZocloPrice = getProfilePrice(zocloSelection.lower);

    // Calculate total lengths in meters
    const jambaTotal = (parseFloat(measurements.jambaVertical.measure) * measurements.jambaVertical.pieces + 
                      parseFloat(measurements.jambaHorizontal.measure) * measurements.jambaHorizontal.pieces) / 100;
    const rielTotal = parseFloat(measurements.riel.measure) / 100;
    const rielAdicionalTotal = parseFloat(measurements.rielAdicional.measure) / 100;
    const cercoChapaTotal = (parseFloat(measurements.ventilaCorrCercochapa.measure) * measurements.ventilaCorrCercochapa.pieces) / 100;
    const trasTotal = (parseFloat(measurements.ventilaCorrTraslape.measure) * measurements.ventilaCorrTraslape.pieces) / 100;
    const zocloUpperTotal = (parseFloat(measurements.zoclo.measure) * 4) / 100;
    const zocloLowerTotal = (parseFloat(measurements.zoclo.measure) * 4) / 100;

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
      rielAdicional: {
        totalLength: (rielAdicionalTotal * 100).toFixed(1),
        cost: (rielAdicionalTotal * rielAdicionalPrice.pricePerM).toFixed(2)
      },
      cercochapa: {
        totalLength: (cercoChapaTotal * 100).toFixed(1),
        cost: (cercoChapaTotal * cercoPrice.pricePerM).toFixed(2)
      },
      traslape: {
        totalLength: (trasTotal * 100).toFixed(1),
        cost: (trasTotal * trasPrice.pricePerM).toFixed(2)
      },
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
      rielAdicional: {
        pieces: Math.ceil(rielAdicionalTotal / 6),
        cost: (Math.ceil(rielAdicionalTotal / 6) * rielAdicionalPrice.price6m).toFixed(2)
      },
      cercochapa: {
        pieces: Math.ceil(cercoChapaTotal / 6),
        cost: (Math.ceil(cercoChapaTotal / 6) * cercoPrice.price6m).toFixed(2)
      },
      traslape: {
        pieces: Math.ceil(trasTotal / 6),
        cost: (Math.ceil(trasTotal / 6) * trasPrice.price6m).toFixed(2)
      }
    };

    // Calculate zoclo costs
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
      measurements,
      fractionCosts,
      grossCosts,
      zocloCost
    };
  };

  const calculateGlassMeasurements = () => {
    if (!results) return null;

    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h) return null;

    const ZOCLO_MEASUREMENTS: { [key: string]: number } = {
      'ZOCLO 1V_L3': 5.9,
      'ZOCLO 2V_L3': 7.6,
      'CABEZAL_L3': 3.6
    };

    const zocloInferior = ZOCLO_MEASUREMENTS[zocloSelection.lower] || 5.9;
    const zocloSuperior = ZOCLO_MEASUREMENTS[zocloSelection.upper] || 5.9;

    const adjustmentValue = glassAdjustment === '' ? 2 : typeof glassAdjustment === 'string' ? parseFloat(glassAdjustment) : glassAdjustment;
    const glassWidth = (w - formula.zocloWidth) / 4 + adjustmentValue;
    const glassHeight = h - formula.ventilaCorrHeight - zocloInferior - zocloSuperior + adjustmentValue;

    return {
      width: glassWidth.toFixed(1),
      height: glassHeight.toFixed(1)
    };
  };

  const calculateSquareMeters = (measurements: { width: string; height: string } | null) => {
    if (!measurements) return null;

    const widthInMeters = parseFloat(measurements.width) / 100;
    const heightInMeters = parseFloat(measurements.height) / 100;

    const area = widthInMeters * heightInMeters;
    const totalArea = area * 4;

    return {
      area: area.toFixed(2),
      totalArea: totalArea.toFixed(2),
      pieces: 4
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
      type: '4 Corredizas',
      line: 'Línea Nacional de 3',
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
        { name: 'JAMBA_L3', totalLength: parseFloat(results.fractionCosts.jamba.totalLength), cost: parseFloat(results.fractionCosts.jamba.cost) },
        { name: 'RIEL_L3', totalLength: parseFloat(results.fractionCosts.riel.totalLength), cost: parseFloat(results.fractionCosts.riel.cost) },
        { name: 'RIEL ADICIONAL_L3', totalLength: parseFloat(results.fractionCosts.rielAdicional.totalLength), cost: parseFloat(results.fractionCosts.rielAdicional.cost) },
        { name: 'CERCO_L3', totalLength: parseFloat(results.fractionCosts.cercochapa.totalLength), cost: parseFloat(results.fractionCosts.cercochapa.cost) },
        { name: 'TRASLAPE_L3', totalLength: parseFloat(results.fractionCosts.traslape.totalLength), cost: parseFloat(results.fractionCosts.traslape.cost) },
        { name: zocloSelection.upper, totalLength: parseFloat(results.fractionCosts.zocloUpper.totalLength), cost: parseFloat(results.fractionCosts.zocloUpper.cost), zocloPosition: 'superior' },
        { name: zocloSelection.lower, totalLength: parseFloat(results.fractionCosts.zocloLower.totalLength), cost: parseFloat(results.fractionCosts.zocloLower.cost), zocloPosition: 'inferior' }
      ] : [
        { name: 'JAMBA_L3', totalLength: results.grossCosts.jamba.pieces * 600, cost: parseFloat(results.grossCosts.jamba.cost) },
        { name: 'RIEL_L3', totalLength: results.grossCosts.riel.pieces * 600, cost: parseFloat(results.grossCosts.riel.cost) },
        { name: 'RIEL ADICIONAL_L3', totalLength: results.grossCosts.rielAdicional.pieces * 600, cost: parseFloat(results.grossCosts.rielAdicional.cost) },
        { name: 'CERCO_L3', totalLength: results.grossCosts.cercochapa.pieces * 600, cost: parseFloat(results.grossCosts.cercochapa.cost) },
        { name: 'TRASLAPE_L3', totalLength: results.grossCosts.traslape.pieces * 600, cost: parseFloat(results.grossCosts.traslape.cost) },
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
  const glassMeasurements = calculateGlassMeasurements();
  const squareMeters = calculateSquareMeters(glassMeasurements);

  // Calcular el costo total de los herrajes
  const additionalHardwareCost = selectedHardware.reduce((sum, item) => sum + item.total, 0);

  // Calcular el costo total de los vidrios
  const additionalGlassCost = selectedGlass.reduce((sum, item) => sum + item.total, 0);

  const totalFractionCost = results ?
    parseFloat(results.fractionCosts.jamba.cost) +
    parseFloat(results.fractionCosts.riel.cost) +
    parseFloat(results.fractionCosts.rielAdicional.cost) +
    parseFloat(results.fractionCosts.cercochapa.cost) +
    parseFloat(results.fractionCosts.traslape.cost) +
    parseFloat(results.fractionCosts.zocloUpper.cost) +
    parseFloat(results.fractionCosts.zocloLower.cost) +
    additionalHardwareCost +
    additionalGlassCost : 0;

  const totalGrossCost = results ?
    parseFloat(results.grossCosts.jamba.cost) +
    parseFloat(results.grossCosts.riel.cost) +
    parseFloat(results.grossCosts.rielAdicional.cost) +
    parseFloat(results.grossCosts.cercochapa.cost) +
    parseFloat(results.grossCosts.traslape.cost) +
    ('pieces' in results.zocloCost ?
      parseFloat(results.zocloCost.cost) :
      parseFloat(results.zocloCost.upper.cost) + parseFloat(results.zocloCost.lower.cost)) +
    additionalHardwareCost +
    additionalGlassCost : 0;

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
            {['ZOCLO 1V_L3', 'ZOCLO 2V_L3', 'CABEZAL_L3'].map((profile) => (
              <button
                key={profile}
                onClick={() => handleZocloSelect(
                  isCustomizingUpper ? 'upper' : 'lower',
                  profile
                )}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 rounded"
              >
                <span>{profile.replace('_L3', '')}</span>
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
          <span className="text-sm">Superior ({zocloSelection.upper.replace('_L3', '')}):</span>
          <div className="text-right">
            <div className="font-bold">
              {formatMeasurement(results?.measurements.zoclo.pieces / 2 || 0, results?.measurements.zoclo.measure || '0.0')}
            </div>
            <div className="text-sm text-gray-500">
              ${results?.fractionCosts.zocloUpper.cost || '0.00'}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm">Inferior ({zocloSelection.lower.replace('_L3', '')}):</span>
          <div className="text-right">
            <div className="font-bold">
              {formatMeasurement(results?.measurements.zoclo.pieces / 2 || 0, results?.measurements.zoclo.measure || '0.0')}
            </div>
            <div className="text-sm text-gray-500">
              ${results?.fractionCosts.zocloLower.cost || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
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
                  <span className="text-lg font-medium">RIEL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.fractionCosts.riel.totalLength} CM</div>
                    <div className="text-sm text-gray-600">${results.fractionCosts.riel.cost}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-lg font-medium">RIEL ADICIONAL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.fractionCosts.rielAdicional.totalLength} CM</div>
                    <div className="text-sm text-gray-600">${results.fractionCosts.rielAdicional.cost}</div>
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

                <div className="border-b border-gray-200 pb-2">
                  <ZocloDropdown />
                </div>

                {/* Sección de herrajes */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <HardwareSearchAndSelection
                    hardware={hardware}
                    selectedHardware={selectedHardware}
                    onSelectedHardwareChange={setSelectedHardware}
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
                  <span className="text-lg font-medium">RIEL ADICIONAL:</span>
                  <div className="text-right">
                    <div className="font-bold">{results.grossCosts.rielAdicional.pieces} PIEZA{results.grossCosts.rielAdicional.pieces > 1 ? 'S' : ''} DE 6M</div>
                    <div className="text-sm text-gray-600">${results.grossCosts.rielAdicional.cost}</div>
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

                <div className="border-b border-gray-200 pb-2">
                  <div className="text-lg font-medium mb-2">ZOCLO:</div>
                  {zocloSelection.upper === zocloSelection.lower ? (
                    <div className="pl-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{zocloSelection.upper}:</span>
                        <div className="text-right">
                          <div className="font-bold">{results.zocloCost.pieces} PIEZA{results.zocloCost.pieces > 1 ? 'S' : ''} DE 6M</div>
                          <div className="text-sm text-gray-600">${results.zocloCost.cost}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{zocloSelection.upper}:</span>
                        <div className="text-right">
                          <div className="font-bold">{results.zocloCost.upper.pieces} PIEZA{results.zocloCost.upper.pieces > 1 ? 'S' : ''} DE 6M</div>
                          <div className="text-sm text-gray-600">${results.zocloCost.upper.cost}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">{zocloSelection.lower}:</span>
                        <div className="text-right">
                          <div className="font-bold">{results.zocloCost.lower.pieces} PIEZA{results.zocloCost.lower.pieces > 1 ? 'S' : ''} DE 6M</div>
                          <div className="text-sm text-gray-600">${results.zocloCost.lower.cost}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección de herrajes en costo bruto */}
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

                {/* Sección de vidrios en costo bruto */}
                {selectedGlass.length > 0 && (
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-lg font-medium mb-2">VIDRIOS:</div>
                    <div className="pl-4">
                      {selectedGlass.map((item, index) => (
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

      {showFormulaCustomizer && (
        <FourSlidingFormulaCustomizer
          onClose={() => setShowFormulaCustomizer(false)}
          onSave={handleSaveFormula}
        />
      )}

      {showGlassModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50"
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
                      <div className="left-1/2 -translate-x-1/2 top-8 z-50 w-64 max-w-[calc(100vw-2rem)] bg-blue-600 text-white p-4 rounded-lg shadow-xl">
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
                <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-400 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white bg-blue-500 px-4 py-2 rounded-lg mb-4 text-center">
                    VENTILA CORREDIZA
                  </h3>
                  <p className="text-gray-800 font-bold text-lg text-center">
                    4 pz de {glassMeasurements.width} cm x {glassMeasurements.height} cm
                  </p>
                </div>

                {squareMeters && (
                  <div className="bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-400 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">
                      Metros Cuadrados Totales
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-700 font-semibold">Total de piezas:</span>
                        <span className="text-purple-900 font-bold text-lg">{squareMeters.pieces} pz</span>
                      </div>
                      <div className="border-t border-purple-300 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-800 font-bold text-lg">TOTAL:</span>
                          <span className="text-purple-900 font-bold text-2xl">{squareMeters.totalArea} m²</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Información de Perfiles:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Zócalo Superior: <span className="font-semibold">{zocloSelection.upper.replace('_L3', '')}</span></p>
                    <p>Zócalo Inferior: <span className="font-semibold">{zocloSelection.lower.replace('_L3', '')}</span></p>
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