import React, { useState } from 'react';
import { ArrowLeft, Plus, Save, FolderOpen, Trash2 } from 'lucide-react';
import { Canvas } from './Canvas';
import { AddComponentMenu } from './AddComponentMenu';
import { SavePackageModal } from './SavePackageModal';
import { SavedPackagesModal } from './SavedPackagesModal';
import { useSyncedState } from '../hooks/useSyncedState';
import { ExportOptionsModal } from './ExportOptionsModal';

interface Component {
  id: string;
  type: 'text' | 'door' | 'fixed-sliding-window' | 'double-sliding-window' | 'two-fixed-two-sliding-window' | 'four-sliding-window' | 'glass';
  content?: string;
  position: { x: number; y: number };
  fixedWidth: number;
  fixedHeight: number;
  gridColumn: number;
  gridRow: number;
  doorWidth?: string;
  doorHeight?: string;
  windowWidth?: string;
  windowHeight?: string;
  glassWidth?: string;
  glassHeight?: string;
}

interface NotesProps {
  onBack: () => void;
  onNavigateToCalculator?: (
    option: 'quote' | 'work', 
    line: 'L3' | 'L2', 
    componentType: 'door' | 'window' | 'glass', 
    windowType?: string,
    width?: string, 
    height?: string
  ) => void;
}

// Reduced margins for better mobile display
const COMPONENT_MARGIN_X = 60; // Increased spacing between columns
const COMPONENT_MARGIN_Y = 50; // Increased for better vertical spacing
const MAX_COLUMNS = 2;

const getDefaultComponentSize = (componentType: string) => {
  const sizes = {
    text: { width: 80, height: 70 },
    door: { width: 60, height: 100 },
    'fixed-sliding-window': { width: 80, height: 80 },
    'double-sliding-window': { width: 80, height: 80 },
    'two-fixed-two-sliding-window': { width: 80, height: 80 },
    'four-sliding-window': { width: 80, height: 80 },
    'glass': { width: 80, height: 80 }
  };
  return sizes[componentType as keyof typeof sizes] || { width: 80, height: 80 };
};

const reorganizeComponents = (components: Component[]) => {
  const reorganized: Component[] = [];
  let currentX = COMPONENT_MARGIN_X;
  let currentY = COMPONENT_MARGIN_Y;
  let currentColumn = 0;
  let maxHeightInRow = 0;
  
  components.forEach((component, index) => {
    // Si llegamos al máximo de columnas, pasar a la siguiente fila
    if (currentColumn >= MAX_COLUMNS) {
      currentColumn = 0;
      currentX = COMPONENT_MARGIN_X;
      currentY += maxHeightInRow + COMPONENT_MARGIN_Y;
      maxHeightInRow = 0;
    }
    
    // Usar el tamaño actual del componente o el tamaño por defecto
    const componentWidth = component.fixedWidth || getDefaultComponentSize(component.type).width;
    const componentHeight = component.fixedHeight || getDefaultComponentSize(component.type).height;
    
    // Actualizar la altura máxima de la fila actual
    maxHeightInRow = Math.max(maxHeightInRow, componentHeight);
    
    reorganized.push({
      ...component,
      position: { x: currentX, y: currentY },
      gridColumn: currentColumn,
      gridRow: Math.floor(index / MAX_COLUMNS),
      fixedWidth: componentWidth,
      fixedHeight: componentHeight
    });
    
    // Mover a la siguiente posición
    currentX += componentWidth + COMPONENT_MARGIN_X;
    currentColumn++;
  });
  
  return reorganized;
};

// New HelpModal Component with Tutorial Thumbnail for Notes
interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

interface TutorialButtonProps {
  imageUrl: string;
  title: string;
  videoUrl: string;
}

function TutorialButton({ imageUrl, title, videoUrl }: TutorialButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => {
      window.open(videoUrl, '_blank');
      setIsPressed(false);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      {/* Thumbnail Image - Clickable */}
      <div
        onClick={handleClick}
        className={`cursor-pointer transition-transform ${
          isPressed ? 'scale-95' : 'hover:scale-105'
        }`}
        style={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {/* Button */}
      <button
        onClick={handleClick}
        className={`transition-all ${isPressed ? 'scale-95' : ''}`}
        style={{
          lineHeight: 1,
          backgroundColor: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35em',
          padding: '0.75em 1.5em',
          color: '#fff',
          border: '1px solid transparent',
          fontWeight: 700,
          borderRadius: '2em',
          fontSize: '1rem',
          boxShadow: '0 0.7em 1.5em -0.5em rgba(0, 255, 17, 0.745)',
          background: 'linear-gradient(90deg, #00FF11 0%, #00FF11 100%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#f4f5f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        <span>{title}</span>
      </button>
    </div>
  );
}

function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  const tutorial = {
    imageUrl: '/assets/miniaturas/notas/nota.png',
    title: 'NOTAS',
    videoUrl: 'https://www.youtube.com/playlist?list=PL2CS-Ysr2M95H0ePwAmD2GYEXnx92_4ZC',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center rounded-t-3xl z-10">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Cerrar"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 ml-4">Tutoriales de ayuda</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <TutorialButton
            imageUrl={tutorial.imageUrl}
            title={tutorial.title}
            videoUrl={tutorial.videoUrl}
          />
        </div>
      </div>
    </div>
  );
}

export function Notes({ onBack, onNavigateToCalculator }: NotesProps) {
  const [components, setComponents] = useSyncedState<Component[]>('notesCanvasComponents', []);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedPackagesModal, setShowSavedPackagesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [exportingComponent, setExportingComponent] = useState<{
    id: string;
    type: string;
    width: string;
    height: string;
  } | null>(null);

  const handleAddComponent = (type: 'text' | 'door' | 'fixed-sliding-window' | 'double-sliding-window' | 'two-fixed-two-sliding-window' | 'four-sliding-window' | 'glass') => {
    const defaultSize = getDefaultComponentSize(type);
    
    // Crear el nuevo componente con posición temporal
      COMPONENT_MARGIN_X + defaultSize.width + COMPONENT_MARGIN_X;

    const newComponent: Component = {
      id: crypto.randomUUID(),
      type,
      content: type === 'text' ? '' : undefined,
      position: { x: 0, y: 0 }, // Posición temporal
      fixedWidth: defaultSize.width,
      fixedHeight: defaultSize.height,
      gridColumn: 0, // Se calculará en reorganizeComponents
      gridRow: 0, // Se calculará en reorganizeComponents
      doorWidth: type === 'door' ? '' : undefined,
      doorHeight: type === 'door' ? '' : undefined,
      windowWidth: (type === 'fixed-sliding-window' || type === 'double-sliding-window' || type === 'two-fixed-two-sliding-window' || type === 'four-sliding-window') ? '' : undefined,
      windowHeight: (type === 'fixed-sliding-window' || type === 'double-sliding-window' || type === 'two-fixed-two-sliding-window' || type === 'four-sliding-window') ? '' : undefined,
      glassWidth: type === 'glass' ? '' : undefined,
      glassHeight: type === 'glass' ? '' : undefined,
    };

    // Agregar el nuevo componente y reorganizar todos
    const newComponentsList = [...components, newComponent];
    const reorganizedComponents = reorganizeComponents(newComponentsList);
    setComponents(reorganizedComponents);
  };

  const handleUpdateComponent = (id: string, updates: Partial<Component>) => {
    console.log('Notes - Updating component with:', updates, 'for component ID:', id);
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const handleDeleteComponent = (id: string) => {
    setComponents(prev => {
      const filteredComponents = prev.filter(comp => comp.id !== id);
      return reorganizeComponents(filteredComponents);
    });
  };

  const handleSavePackage = (name: string) => {
    const packageData = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      components,
      totalComponents: components.length
    };

    const savedPackages = JSON.parse(localStorage.getItem('savedPackages') || '[]');
    savedPackages.push(packageData);
    localStorage.setItem('savedPackages', JSON.stringify(savedPackages));
    
    setShowSaveModal(false);
    alert('¡Paquete guardado exitosamente!');
  };

  const handleLoadPackage = (packageData: any) => {
    const reorganizedComponents = reorganizeComponents(packageData.components);
    setComponents(reorganizedComponents);
    setShowSavedPackagesModal(false);
    alert(`Paquete "${packageData.name}" cargado exitosamente!`);
  };

  const handleExportComponent = (id: string, type: string, width: string, height: string) => {
    console.log('Notes - handleExportComponent called with:', { id, type, width, height });
    if (!width || !height) {
      alert('Por favor, ingrese las medidas de ancho y alto antes de exportar.');
      return;
    }
    
    console.log('Notes - Exporting component with width:', width, 'height:', height, 'type:', type);
    // Convertir el tipo de componente al formato esperado por el modal
   const exportType = type;
    setExportingComponent({ id, type: exportType, width, height });
    setShowExportModal(true);
  };
  
  const handleExportOptionSelected = (option: 'quote' | 'work', line: 'L3' | 'L2') => {
    console.log('Notes - Export option selected:', option, line);
    console.log('🔍 Notes - exportingComponent antes de navegar:', exportingComponent);
    if (!exportingComponent || !onNavigateToCalculator) return;

    const { type, width, height } = exportingComponent;
    console.log('Notes - Navigating with component:', { type, width, height });
    console.log('🔍 Notes - Medidas que se van a enviar: width =', width, ', height =', height);

    // Determinar el tipo de componente para la navegación (door, window, o glass)
    const componentType = type === 'door' ? 'door' : type === 'glass' ? 'glass' : 'window';

    console.log('🔍 Notes - Llamando onNavigateToCalculator con:', {
      option,
      line,
      componentType,
      type,
      width,
      height,
      fromNotes: true
    });

    // Navegar a la calculadora correspondiente - IMPORTANTE: pasar fromNotes=true
    onNavigateToCalculator(option, line, componentType, type, width, height, true);

    // Cerrar el modal
    setShowExportModal(false);
    setExportingComponent(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#003366]">
      {/* Header con posición relativa para que ocupe su propio espacio */}
      <div className="relative p-4 sm:p-6 flex flex-wrap justify-between items-center gap-2 z-50 px-4 sm:px-6">
        {/* Botón de volver */}
        <button
          onClick={onBack}
          className="bg-white text-[#003366] p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        
        {/* Contenedor de botones de acción */}
        <div className="flex flex-wrap gap-2 justify-end flex-grow">
          <button
            onClick={() => setShowSavedPackagesModal(true)}
            className="bg-white text-[#003366] px-3 py-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-1 font-medium text-sm flex-shrink-0"
          >
            <FolderOpen size={16} />
            <span className="hidden sm:inline">Ver Paquetes</span>
          </button>

          {components.length > 0 && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-green-500 text-white px-3 py-2 rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center gap-1 font-medium text-sm flex-shrink-0"
            >
              <Save size={16} />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          )}

          {components.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro que deseas borrar todos los componentes? Esta acción no se puede deshacer.')) {
                  setComponents([]);
                }
              }}
              className="bg-red-500 text-white px-3 py-2 rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center gap-1 font-medium text-sm flex-shrink-0"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Borrar Todo</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="bg-white text-[#003366] p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0"
              title="Agregar elementos"
            >
              <Plus size={20} />
            </button>
            {showAddMenu && (
              <AddComponentMenu
                onClose={() => setShowAddMenu(false)}
                onAddComponent={handleAddComponent}
              />
            )}
          </div>

          <button
            onClick={() => setShowHelpModal(true)}
            className="bg-white text-[#003366] px-3 py-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-1 font-medium text-sm flex-shrink-0"
          >
            <span>¿Necesitas ayuda?</span>
          </button>
        </div>
      </div>

      {/* Contenedor principal que ocupa el resto del espacio disponible */}
      <div className="relative flex-grow">
        <Canvas 
          components={components}
          onUpdateComponent={handleUpdateComponent}
          onDeleteComponent={handleDeleteComponent}
          onExportComponent={handleExportComponent}
        />
      </div>

      {components.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white bg-black bg-opacity-20 p-4 sm:p-8 rounded-lg backdrop-blur-sm mx-4 pointer-events-none">
            <p className="text-xl sm:text-2xl font-bold mb-2 px-4 sm:px-8">Lienzo vacío</p>
            <p className="text-base sm:text-lg">Haz clic en "Elementos" para agregar componentes</p>
          </div>
        </div>
      )}

      {showSaveModal && (
        <SavePackageModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSavePackage}
        />
      )}

      {showSavedPackagesModal && (
        <SavedPackagesModal
          onClose={() => setShowSavedPackagesModal(false)}
          onLoadPackage={handleLoadPackage}
        />
      )}
      
      {showExportModal && exportingComponent && (
        <ExportOptionsModal
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setExportingComponent(null);
          }}
          windowType={
            exportingComponent.type === 'fixed-sliding-window' ? 'Fijo Corredizo' :
            exportingComponent.type === 'double-sliding-window' ? 'Doble Corrediza' :
            exportingComponent.type === 'two-fixed-two-sliding-window' ? '2 Fijos 2 Corredizos' :
            exportingComponent.type === 'four-sliding-window' ? '4 Corredizas' :
            exportingComponent.type === 'door' ? 'Puerta' :
            exportingComponent.type === 'glass' ? 'Vidrio' : 'Ventana'
          }
          windowDimensions={{
            width: exportingComponent.width,
            height: exportingComponent.height
          }}
          onSelectOption={handleExportOptionSelected}
        />
      )}

      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}