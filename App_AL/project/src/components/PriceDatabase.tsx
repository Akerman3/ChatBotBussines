import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { useSyncedState } from '../hooks/useSyncedState';
import { emitPriceUpdate } from '../hooks/usePriceUpdates';
import {
  syncProfilesToSupabase,
  syncHardwareToSupabase,
  syncGlassToSupabase,
  syncIvaPercentageToSupabase
} from '../utils/supabasePriceSync';

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

interface Glass {
  name: string;
  pricePerPiece: string;
  pricePerM2: string;
}

interface OtherItem {
  name: string;
  type: 'profile' | 'hardware';
  price: string;
}

interface PriceDatabaseProps {
  onBack: () => void;
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

const createDefaultColorPrices = () => 
  AVAILABLE_COLORS.reduce((acc, color) => ({
    ...acc,
    [color]: { price6m: '', pricePerM: '' }
  }), {});

export function PriceDatabase({ onBack }: PriceDatabaseProps) {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const savedProfiles = localStorage.getItem('windowProfiles');
    if (savedProfiles) { 
      try {
        const parsedProfiles = JSON.parse(savedProfiles);
        return parsedProfiles.map((profile: any) => ({
          name: profile.name,
          colors: {
            ...createDefaultColorPrices(),
            ...(profile.colors || {})
          }
        }));
      } catch (error) {
        console.error('Error parsing profiles:', error);
        return [];
      }
    }
    return [
      { name: 'JAMBA_L3', colors: createDefaultColorPrices() },
      { name: 'RIEL_L3', colors: createDefaultColorPrices() },
      { name: 'CERCO_L3', colors: createDefaultColorPrices() },
      { name: 'TRASLAPE_L3', colors: createDefaultColorPrices() },
      { name: 'ZOCLO 1V_L3', colors: createDefaultColorPrices() },
      { name: 'ZOCLO 2V_L3', colors: createDefaultColorPrices() },
      { name: 'CABEZAL_L3', colors: createDefaultColorPrices() },
      { name: 'RIEL ADICIONAL_L3', colors: createDefaultColorPrices() },
      { name: 'JAMBA_L2', colors: createDefaultColorPrices() },
      { name: 'RIEL_L2', colors: createDefaultColorPrices() },
      { name: 'CERCO_L2', colors: createDefaultColorPrices() },
      { name: 'TRASLAPE_L2', colors: createDefaultColorPrices() },
      { name: 'ZOCLO 1V_L2', colors: createDefaultColorPrices() },
      { name: 'ZOCLO 2V_L2', colors: createDefaultColorPrices() },
      { name: 'CABEZAL_L2', colors: createDefaultColorPrices() },
      { name: 'RIEL ADICIONAL_L2', colors: createDefaultColorPrices() },
      // No perfiles genéricos por defecto
    ];
  });

  const [hardware, setHardware] = useState<Hardware[]>(() => {
    const savedHardware = localStorage.getItem('windowHardware');
    if (savedHardware) {
      return JSON.parse(savedHardware);
    }
    return [
      // Herrajes para Línea 3
      { name: 'FELPA_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'TORNILLOS_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'PIJA 10X1_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'PIJA 10X1.5_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'J. ESTRIADA_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'E. TECNO_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'E. HERRALUM_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CARRETILLA EMBUTIR_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CARRETILLA METAL_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CARRETILLA AJUSTABLE_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CARRETILLA DOBLE_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CIERRE EMBUTIR_L3', pricePerPackage: '', pricePerPiece: '' },
      { name: 'JALADERA PERICO_L3', pricePerPackage: '', pricePerPiece: '' },
      
      // Herrajes para Línea 2
      { name: 'FELPA_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'TORNILLOS_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'PIJA 8X1_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'PIJA 8X1.5_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'J. ESTRIADA_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'E. TECNO_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'E. HERRALUM_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CARRETILLA EMBUTIR_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CARRETILLA METAL_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CARRETILLA AJUSTABLE_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'CIERRE EMBUTIR_L2', pricePerPackage: '', pricePerPiece: '' },
      { name: 'JALADERA PERICO_L2', pricePerPackage: '', pricePerPiece: '' },
      
      // No herrajes genéricos por defecto
    ];
  });

  const [glass, setGlass] = useState<Glass[]>(() => {
    const savedGlass = localStorage.getItem('windowGlass');
    if (savedGlass) {
      return JSON.parse(savedGlass);
    }
    return [
      { name: 'CLARO 6MM', pricePerPiece: '', pricePerM2: '' },
      { name: 'FILTRASOL 6MM', pricePerPiece: '', pricePerM2: '' },
      { name: 'REFLECTA 6MM', pricePerPiece: '', pricePerM2: '' },
      { name: 'TINTEX 6MM', pricePerPiece: '', pricePerM2: '' },
    ];
  });

  const [newProfileName, setNewProfileName] = useState('');
  const [newHardwareName, setNewHardwareName] = useState('');
  const [newGlassName, setNewGlassName] = useState('');
  
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showAddHardware, setShowAddHardware] = useState(false);
  const [showAddGlass, setShowAddGlass] = useState(false);
  
  const [selectedColor, setSelectedColor] = useState<string>(AVAILABLE_COLORS[0]);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    type: 'profile' | 'hardware' | 'glass';
    index: number;
    name: string;
    fullInternalName: string;
  } | null>(null);
  const [hardwareLineType, setHardwareLineType] = useState<'L2' | 'L3' | 'generic'>('L3');
  const [profileLineType, setProfileLineType] = useState<'L2' | 'L3' | 'others'>('L3');
  const [ivaPercentage, setIvaPercentage] = useSyncedState<number>('materialIvaPercentage', 16);
  const [ivaInputValue, setIvaInputValue] = useState<string>(String(ivaPercentage));
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Elementos predeterminados que no se pueden eliminar
  const DEFAULT_PROFILE_NAMES_FULL = [
    'JAMBA_L3', 'RIEL_L3', 'CERCO_L3', 'TRASLAPE_L3', 'ZOCLO 1V_L3', 'ZOCLO 2V_L3', 'CABEZAL_L3',
    'RIEL ADICIONAL_L3',
    'JAMBA_L2', 'RIEL_L2', 'CERCO_L2', 'TRASLAPE_L2', 'ZOCLO 1V_L2', 'ZOCLO 2V_L2', 'CABEZAL_L2',
    'RIEL ADICIONAL_L2'
  ];

  const DEFAULT_HARDWARE_NAMES_FULL = [
    'FELPA_L3', 'TORNILLOS_L3', 'PIJA 10X1_L3', 'PIJA 10X1.5_L3', 'J. ESTRIADA_L3', 'E. TECNO_L3', 
    'E. HERRALUM_L3', 'CARRETILLA EMBUTIR_L3', 'CARRETILLA METAL_L3', 'CARRETILLA AJUSTABLE_L3', 
    'CARRETILLA DOBLE_L3', 'CIERRE EMBUTIR_L3', 'JALADERA PERICO_L3',
    'FELPA_L2', 'TORNILLOS_L2', 'PIJA 8X1_L2', 'PIJA 8X1.5_L2', 'J. ESTRIADA_L2', 'E. TECNO_L2', 
    'E. HERRALUM_L2', 'CARRETILLA EMBUTIR_L2', 'CARRETILLA METAL_L2', 'CARRETILLA AJUSTABLE_L2', 
    'CIERRE EMBUTIR_L2', 'JALADERA PERICO_L2'
  ];

  const DEFAULT_GLASS_NAMES_FULL = [
    'CLARO 6MM', 'FILTRASOL 6MM', 'REFLECTA 6MM', 'TINTEX 6MM'
  ];

  // Función para verificar si un elemento es predeterminado
  const isDefaultItem = (type: 'profile' | 'hardware' | 'glass', name: string): boolean => {
    switch (type) {
      case 'profile':
        return DEFAULT_PROFILE_NAMES_FULL.includes(name);
      case 'hardware':
        return DEFAULT_HARDWARE_NAMES_FULL.includes(name);
      case 'glass':
        return DEFAULT_GLASS_NAMES_FULL.includes(name);
      default:
        return false;
    }
  };

  useEffect(() => {
    localStorage.setItem('windowProfiles', JSON.stringify(profiles));
    emitPriceUpdate();

    syncProfilesToSupabase(profiles).then(success => {
      if (success) {
        console.log('✅ Perfiles sincronizados con Supabase');
      }
    });
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('windowHardware', JSON.stringify(hardware));
    emitPriceUpdate();

    syncHardwareToSupabase(hardware).then(success => {
      if (success) {
        console.log('✅ Herrajes sincronizados con Supabase');
      }
    });
  }, [hardware]);

  useEffect(() => {
    localStorage.setItem('windowGlass', JSON.stringify(glass));
    emitPriceUpdate();

    syncGlassToSupabase(glass).then(success => {
      if (success) {
        console.log('✅ Vidrios sincronizados con Supabase');
      }
    });
  }, [glass]);

  useEffect(() => {
    localStorage.setItem('materialIvaPercentage', JSON.stringify(ivaPercentage));

    syncIvaPercentageToSupabase(ivaPercentage).then(success => {
      if (success) {
        console.log('✅ Porcentaje de IVA sincronizado con Supabase');
      }
    });
  }, [ivaPercentage]);

  useEffect(() => {
    setIvaInputValue(String(ivaPercentage));
  }, [ivaPercentage]);

  const handleProfilePriceChange = (index: number, field: 'price6m' | 'pricePerM', value: string) => {
    if (!selectedColor) return;
    
    const newProfiles = [...profiles];
    
    if (!newProfiles[index].colors[selectedColor]) {
      newProfiles[index].colors[selectedColor] = { price6m: '', pricePerM: '' };
    }

    if (field === 'price6m') {
      newProfiles[index].colors[selectedColor].price6m = value;
      newProfiles[index].colors[selectedColor].pricePerM = value ? (parseFloat(value) / 6).toFixed(2) : '';
    } else {
      newProfiles[index].colors[selectedColor].pricePerM = value;
      newProfiles[index].colors[selectedColor].price6m = value ? (parseFloat(value) * 6).toFixed(2) : '';
    }
    setProfiles(newProfiles);
  };

  const handleHardwarePriceChange = (index: number, field: 'pricePerPackage' | 'pricePerPiece', value: string) => {
    const newHardware = [...hardware];
    newHardware[index][field] = value;
    setHardware(newHardware);
  };

  const handleGlassPriceChange = (index: number, field: 'pricePerPiece' | 'pricePerM2', value: string) => {
    const newGlass = [...glass];
    newGlass[index][field] = value;
    setGlass(newGlass);
  };

  const addNewProfile = () => {
    if (newProfileName.trim()) {
      // Si es "others", no agregar sufijo
      const suffix = profileLineType === 'others' ? '' : `_${profileLineType}`;
      setProfiles([
        ...profiles,
        {
          name: `${newProfileName.toUpperCase()}${suffix}`,
          colors: createDefaultColorPrices()
        }
      ]);
      setNewProfileName('');
      setShowAddProfile(false);
    }
  };

  const addNewHardware = () => {
    if (newHardwareName.trim()) {
      const suffix = hardwareLineType === 'generic' ? '' : `_${hardwareLineType}`;
      setHardware([
        ...hardware,
        { name: `${newHardwareName.toUpperCase()}${suffix}`, pricePerPackage: '', pricePerPiece: '' }
      ]);
      setNewHardwareName('');
      setShowAddHardware(false);
    }
  };

  const addNewGlass = () => {
    if (newGlassName.trim()) {
      setGlass([
        ...glass,
        { name: newGlassName.toUpperCase(), pricePerPiece: '', pricePerM2: '' }
      ]);
      setNewGlassName('');
      setShowAddGlass(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmation) return;

    const { type, index, fullInternalName } = deleteConfirmation;

    // Verificar si es un elemento predeterminado
    if (isDefaultItem(type, fullInternalName)) {
      alert('No se puede eliminar este elemento porque es parte de la configuración predeterminada del sistema.');
      setDeleteConfirmation(null);
      return;
    }

    if (type === 'profile') {
      const newProfiles = profiles.filter((_, i) => i !== index);
      setProfiles(newProfiles);
    } else if (type === 'hardware') {
      const newHardware = hardware.filter((_, i) => i !== index);
      setHardware(newHardware);
    } else if (type === 'glass') {
      const newGlass = glass.filter((_, i) => i !== index);
      setGlass(newGlass);
    }

    setDeleteConfirmation(null);
  };

  const handleIvaInputChange = (value: string) => {
    setIvaInputValue(value);
  };

  const handleIvaInputBlur = () => {
    if (ivaInputValue === '' || ivaInputValue === null || ivaInputValue === undefined) {
      setIvaPercentage(0);
      setIvaInputValue('0');
    } else {
      const numValue = parseFloat(ivaInputValue);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setIvaPercentage(numValue);
      } else {
        setIvaInputValue(String(ivaPercentage));
      }
    }
  };

  // Filter hardware by line type for display
  const filteredHardware = hardware.filter(item => {
    if (hardwareLineType === 'L2') {
      return item.name.includes('_L2');
    } else if (hardwareLineType === 'L3') {
      return item.name.includes('_L3');
    } else {
      // Para "generic", mostrar solo los que NO tienen sufijo _L2 o _L3
      return !item.name.includes('_L2') && !item.name.includes('_L3');
    }
  });

  // Filter profiles by line type for display
  const filteredProfiles = profiles.filter(item => {
    if (profileLineType === 'L2') {
      return item.name.includes('_L2');
    } else if (profileLineType === 'L3') {
      return item.name.includes('_L3');
    } else {
      // Para "others", mostrar solo los que NO tienen sufijo _L2 o _L3
      return !item.name.includes('_L2') && !item.name.includes('_L3');
    }
  });

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center px-2 sm:px-4 animate-fade-in">
      <div className="w-full pt-4 sm:pt-6 px-2 sm:px-6 flex items-center">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver al menú anterior"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow flex justify-center">
          <div className="relative">
            <button
              onClick={() => setShowColorMenu(!showColorMenu)}
              className="flex items-center gap-2 bg-[#003366] text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-900 transition-colors border border-white text-sm sm:text-base"
            >
              <span>{selectedColor || 'TIPOS DE COLORES'}</span>
              {showColorMenu ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showColorMenu && (
              <div className="absolute z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 w-48 max-h-60 overflow-y-auto left-0">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center"
                  >
                    <span>{color}</span>
                    {selectedColor === color ? (
                      <Check size={16} className="text-green-500" />
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.setItem('windowProfiles', JSON.stringify(profiles));
              localStorage.setItem('windowHardware', JSON.stringify(hardware));
              localStorage.setItem('windowGlass', JSON.stringify(glass));
              setShowSaveSuccess(true);
              setTimeout(() => setShowSaveSuccess(false), 3000);
            }}
            className="flex items-center gap-1 sm:gap-2 bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
          >
            <Save size={18} className="hidden sm:block" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      <div className="text-center my-4 sm:my-8">
        <h1 className="text-white text-4xl sm:text-5xl font-bold mb-2 sm:mb-4">BASE DE DATOS</h1>

        {showSaveSuccess && (
          <div className="mb-4 animate-fade-in">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 shadow-lg">
              <Check size={20} className="font-bold" />
              <span className="font-medium">Se guardó todo correctamente</span>
            </div>
          </div>
        )}

        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg inline-block">
          <p className="text-sm font-medium">
            📝 Nota: Ingrese todos los precios SIN IVA.
            {ivaPercentage > 0
              ? ` El sistema aplicará automáticamente el ${ivaPercentage}% de IVA en las cotizaciones.`
              : ' Con IVA en 0%, los precios se enviarán tal cual están en la base de datos.'
            }
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4">
          <label className="text-white font-medium">Porcentaje de IVA de materiales:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={ivaInputValue}
              onChange={(e) => handleIvaInputChange(e.target.value)}
              onBlur={handleIvaInputBlur}
              className="w-20 px-3 py-2 border rounded-lg text-center"
              placeholder="0"
            />
            <span className="text-white font-medium">%</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-lg p-3 sm:p-6 mb-8 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#003366] mb-2 sm:mb-0">PERFILES</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={profileLineType}
              onChange={(e) => setProfileLineType(e.target.value as 'L2' | 'L3' | 'others')}
              className="flex-1 sm:flex-none px-2 py-1 sm:px-3 sm:py-2 border rounded-lg bg-[#003366] text-white text-sm sm:text-base"
            >
              <option value="L3">Línea Nacional de 3</option>
              <option value="L2">Línea Nacional de 2</option>
              <option value="others">Otros</option>
            </select>
            <button
              onClick={() => setShowAddProfile(true)}
              className="flex items-center gap-1 sm:gap-2 bg-[#003366] text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm sm:text-base"
            >
              <Plus size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Agregar</span>
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">Perfil</span>
            </button>
          </div>
        </div>

        {showAddProfile && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 items-start sm:items-center bg-gray-100 p-3 rounded-lg">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Nombre del perfil"
              className="w-full sm:flex-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg border border-gray-300 mb-2 sm:mb-0"
            />
            <select
              value={profileLineType}
              onChange={(e) => setProfileLineType(e.target.value as 'L2' | 'L3' | 'others')}
              className="w-full sm:w-auto px-2 py-1 sm:px-4 sm:py-2 border rounded-lg mb-2 sm:mb-0"
            >
              <option value="L3">Línea Nacional de 3</option>
              <option value="L2">Línea Nacional de 2</option>
              <option value="others">Otros</option>
            </select>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={addNewProfile}
                className="flex-1 sm:flex-none bg-green-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600"
              >
                Agregar
              </button>
              <button
                onClick={() => setShowAddProfile(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Encabezados de tabla - solo visibles en pantallas medianas y grandes */}
        <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 mb-4 text-[#003366] font-bold">
          <div>PERFIL</div>
          <div className="text-center">PRECIO 6M</div>
          <div className="text-center">PRECIO/M</div>
          <div></div>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg text-gray-500">
            No hay perfiles en esta categoría. Agrega perfiles usando el botón "Agregar Perfil".
          </div>
        ) : (
          filteredProfiles.map((profile, index) => {
            const originalIndex = profiles.findIndex(p => p.name === profile.name);
            const displayName = profile.name
              .replace('_L2', '')
              .replace('_L3', '');
              
            return (
              <div key={profile.name} className="border border-gray-200 rounded-lg p-3 mb-3 sm:border-0 sm:p-0 sm:mb-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] sm:gap-4 sm:items-center">
                <div className="flex justify-between items-center mb-2 sm:mb-0">
                  <div className="font-medium">{displayName}</div>
                  <button
                    onClick={() => setDeleteConfirmation({
                      show: true,
                      type: 'profile',
                      index: originalIndex,
                      name: displayName,
                      fullInternalName: profile.name
                    })}
                    className={`sm:hidden ${
                      isDefaultItem('profile', profile.name)
                        ? 'text-gray-400 cursor-not-allowed opacity-50'
                        : 'text-red-500 hover:text-red-700'
                    }`}
                    disabled={isDefaultItem('profile', profile.name)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {selectedColor ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-0">
                    <div className="flex flex-col">
                      <label className="block text-xs font-medium text-gray-500 sm:hidden mb-1">PRECIO 6M</label>
                      <input
                        type="number"
                        value={profile.colors[selectedColor]?.price6m || ''}
                        onChange={(e) => handleProfilePriceChange(originalIndex, 'price6m', e.target.value)}
                        className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded border text-center text-sm sm:text-base"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-xs font-medium text-gray-500 sm:hidden mb-1">PRECIO/M</label>
                      <input
                        type="number"
                        value={profile.colors[selectedColor]?.pricePerM || ''}
                        onChange={(e) => handleProfilePriceChange(originalIndex, 'pricePerM', e.target.value)}
                        className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded border text-center text-sm sm:text-base"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 text-center text-gray-500 italic mb-2 sm:mb-0">
                    Seleccione un color
                  </div>
                )}
                <div className="hidden sm:block">
                  <button
                    onClick={() => setDeleteConfirmation({
                      show: true,
                      type: 'profile',
                      index: originalIndex,
                      name: displayName,
                      fullInternalName: profile.name
                    })}
                    className={`p-1 ${
                      isDefaultItem('profile', profile.name)
                        ? 'text-gray-400 cursor-not-allowed opacity-50'
                        : 'text-red-500 hover:text-red-700'
                    }`}
                    disabled={isDefaultItem('profile', profile.name)}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003366] mb-2 sm:mb-0">HERRAJES</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={hardwareLineType}
                onChange={(e) => setHardwareLineType(e.target.value as 'L2' | 'L3' | 'generic')}
                className="flex-1 sm:flex-none px-2 py-1 sm:px-3 sm:py-2 border rounded-lg bg-[#003366] text-white text-sm sm:text-base"
              >
                <option value="L3">Línea Nacional de 3</option>
                <option value="L2">Línea Nacional de 2</option>
                <option value="generic">Genéricos</option>
              </select>
              <button
                onClick={() => setShowAddHardware(true)}
                className="flex items-center gap-1 sm:gap-2 bg-[#003366] text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm sm:text-base"
              >
                <Plus size={16} className="sm:hidden" />
                <span className="hidden sm:inline">Agregar</span>
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">Herraje</span>
              </button>
            </div>
          </div>

          {showAddHardware && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 items-start sm:items-center bg-gray-100 p-3 rounded-lg">
              <input
                type="text"
                value={newHardwareName}
                onChange={(e) => setNewHardwareName(e.target.value)}
                placeholder="Nombre del herraje"
                className="w-full sm:flex-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg border border-gray-300 mb-2 sm:mb-0"
              />
              <select
                value={hardwareLineType}
                onChange={(e) => setHardwareLineType(e.target.value as 'L2' | 'L3' | 'generic')}
                className="w-full sm:w-auto px-2 py-1 sm:px-4 sm:py-2 border rounded-lg mb-2 sm:mb-0"
              >
                <option value="L3">Línea Nacional de 3</option>
                <option value="L2">Línea Nacional de 2</option>
                <option value="generic">Genérico</option>
              </select>
              <div className="flex w-full sm:w-auto gap-2">
                <button
                  onClick={addNewHardware}
                  className="flex-1 sm:flex-none bg-green-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowAddHardware(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Encabezados de tabla - solo visibles en pantallas medianas y grandes */}
          <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 mb-4 text-[#003366] font-bold">
            <div>HERRAJE</div>
            <div className="text-center">PRECIO/PAQ</div>
            <div className="text-center">PRECIO/PZ</div>
            <div></div>
          </div>

          {filteredHardware.length === 0 ? (
            <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg text-gray-500">
              No hay herrajes en esta categoría. Agrega herrajes usando el botón "Agregar Herraje".
            </div>
          ) : (
            filteredHardware.map((item, index) => {
              const originalIndex = hardware.findIndex(h => h.name === item.name);
              const displayName = item.name
                .replace('_L2', '')
                .replace('_L3', '');
                
              return (
                <div key={item.name} className="border border-gray-200 rounded-lg p-3 mb-3 sm:border-0 sm:p-0 sm:mb-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] sm:gap-4 sm:items-center">
                  <div className="flex justify-between items-center mb-2 sm:mb-0">
                    <div className="font-medium">{displayName}</div>
                    <button
                      onClick={() => setDeleteConfirmation({
                        show: true,
                        type: 'hardware',
                        index: originalIndex,
                        name: displayName,
                        fullInternalName: item.name
                      })}
                      className={`sm:hidden ${
                        isDefaultItem('hardware', item.name)
                          ? 'text-gray-400 cursor-not-allowed opacity-50'
                          : 'text-red-500 hover:text-red-700'
                      }`}
                      disabled={isDefaultItem('hardware', item.name)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-0">
                    <div className="flex flex-col">
                      <label className="block text-xs font-medium text-gray-500 sm:hidden mb-1">PRECIO/PAQ</label>
                      <input
                        type="number"
                        value={item.pricePerPackage}
                        onChange={(e) => handleHardwarePriceChange(originalIndex, 'pricePerPackage', e.target.value)}
                        className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded border text-center text-sm sm:text-base"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-xs font-medium text-gray-500 sm:hidden mb-1">PRECIO/PZ</label>
                      <input
                        type="number"
                        value={item.pricePerPiece}
                        onChange={(e) => handleHardwarePriceChange(originalIndex, 'pricePerPiece', e.target.value)}
                        className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded border text-center text-sm sm:text-base"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <button
                      onClick={() => setDeleteConfirmation({
                        show: true,
                        type: 'hardware',
                        index: originalIndex,
                        name: displayName,
                        fullInternalName: item.name
                      })}
                      className={`p-1 ${
                        isDefaultItem('hardware', item.name)
                          ? 'text-gray-400 cursor-not-allowed opacity-50'
                          : 'text-red-500 hover:text-red-700'
                      }`}
                      disabled={isDefaultItem('hardware', item.name)}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003366] mb-2 sm:mb-0">VIDRIOS</h2>
            <div className="w-full sm:w-auto">
              <button
                onClick={() => setShowAddGlass(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 bg-[#003366] text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm sm:text-base"
              >
                <Plus size={16} className="sm:hidden" />
                <span className="hidden sm:inline">Agregar</span>
                <span className="sm:hidden">+ Vidrio</span>
              </button>
            </div>
          </div>

          {showAddGlass && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 items-start sm:items-center bg-gray-100 p-3 rounded-lg">
              <input
                type="text"
                value={newGlassName}
                onChange={(e) => setNewGlassName(e.target.value)}
                placeholder="Nombre del vidrio"
                className="w-full sm:flex-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg border border-gray-300 mb-2 sm:mb-0"
              />
              <div className="flex w-full sm:w-auto gap-2">
                <button
                  onClick={addNewGlass}
                  className="flex-1 sm:flex-none bg-green-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowAddGlass(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Encabezados de tabla - solo visibles en pantallas medianas y grandes */}
          <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 mb-4 text-[#003366] font-bold">
            <div>VIDRIO</div>
            <div className="text-center">PRECIO/PZ</div>
            <div className="text-center">PRECIO/M²</div>
            <div></div>
          </div>

          {glass.map((item, index) => (
            <div key={item.name} className="border border-gray-200 rounded-lg p-3 mb-3 sm:border-0 sm:p-0 sm:mb-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] sm:gap-4 sm:items-center">
              <div className="flex justify-between items-center mb-2 sm:mb-0">
                <div className="font-medium">{item.name}</div>
                <button
                  onClick={() => setDeleteConfirmation({
                    show: true,
                    type: 'glass',
                    index,
                    name: item.name,
                    fullInternalName: item.name
                  })}
                  className={`sm:hidden ${
                    isDefaultItem('glass', item.name)
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-red-500 hover:text-red-700'
                  }`}
                  disabled={isDefaultItem('glass', item.name)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-0">
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-500 sm:hidden mb-1">PRECIO/PZ</label>
                  <input
                    type="number"
                    value={item.pricePerPiece}
                    onChange={(e) => handleGlassPriceChange(index, 'pricePerPiece', e.target.value)}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded border text-center text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-500 sm:hidden mb-1">PRECIO/M²</label>
                  <input
                    type="number"
                    value={item.pricePerM2}
                    onChange={(e) => handleGlassPriceChange(index, 'pricePerM2', e.target.value)}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded border text-center text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <button
                  onClick={() => setDeleteConfirmation({
                    show: true,
                    type: 'glass',
                    index,
                    name: item.name,
                    fullInternalName: item.name
                  })}
                  className={`p-1 ${
                    isDefaultItem('glass', item.name)
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-red-500 hover:text-red-700'
                  }`}
                  disabled={isDefaultItem('glass', item.name)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirmation && (
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteConfirmation(null)}
          onConfirm={handleDeleteConfirm}
          itemName={deleteConfirmation.name}
        />
      )}

    </div>
  );
}