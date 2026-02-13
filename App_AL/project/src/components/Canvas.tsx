import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { TextComponent } from './TextComponent';
import { DoorComponent } from './DoorComponent';
import { FixedSlidingWindowComponent } from './FixedSlidingWindowComponent';
import { DoubleSlidingWindowComponent } from './DoubleSlidingWindowComponent';
import { TwoFixedTwoSlidingWindowComponent } from './TwoFixedTwoSlidingWindowComponent';
import { FourSlidingWindowComponent } from './FourSlidingWindowComponent';
import { GlassComponent } from './GlassComponent';

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

interface CanvasProps {
  components: Component[];
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
  onDeleteComponent: (id: string) => void;
  onExportComponent?: (id: string, type: string, width: string, height: string) => void;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  componentType: string;
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, componentType }: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const getComponentName = (type: string) => {
    switch (type) {
      case 'text': return 'Texto';
      case 'door': return 'Puerta';
      case 'fixed-sliding-window': return 'Ventana Fijo Corredizo';
      case 'double-sliding-window': return 'Ventana Doble Corrediza';
      case 'two-fixed-two-sliding-window': return 'Ventana 2 Fijos 2 Corredizos';
      case 'four-sliding-window': return 'Ventana 4 Corredizas';
      case 'glass': return 'Vidrio';
      default: return 'Componente';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-sm mx-auto">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <Trash2 size={24} className="text-red-600" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            Confirmar Eliminación
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            ¿Estás seguro que deseas eliminar este componente de tipo <span className="font-semibold">{getComponentName(componentType)}</span>?
          </p>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            Esta acción no se puede deshacer.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Canvas({ components, onUpdateComponent, onDeleteComponent, onExportComponent }: CanvasProps) {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; componentId: string; componentType: string }>({
    isOpen: false,
    componentId: '',
    componentType: ''
  });

  // Estados para control de arrastre mejorado
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const DRAG_THRESHOLD = 5; // Umbral mínimo de movimiento para considerar que es un arrastre (en píxeles)

  const handleDeleteClick = (componentId: string, componentType: string) => {
    setDeleteModal({
      isOpen: true,
      componentId,
      componentType
    });
  };

  const handleExportClick = (componentId: string, componentType: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component || !onExportComponent) return;
    
    if (componentType === 'door') {
      onExportComponent(
        componentId, 
        componentType, 
        component.doorWidth || '', 
        component.doorHeight || ''
      );
    } else if (componentType === 'glass') {
      onExportComponent(
        componentId, 
        componentType, 
        component.glassWidth || '', 
        component.glassHeight || ''
      );
    } else if (componentType === 'fixed-sliding-window' || 
               componentType === 'double-sliding-window' || 
               componentType === 'two-fixed-two-sliding-window' || 
               componentType === 'four-sliding-window') {
      onExportComponent(
        componentId, 
        componentType, 
        component.windowWidth || '', 
        component.windowHeight || ''
      );
    } else if (componentType === 'glass') {
      onExportComponent(
        componentId, 
        componentType, 
        component.glassWidth || '', 
        component.glassHeight || ''
      );
    }
  };

  const handleConfirmDelete = () => {
    onDeleteComponent(deleteModal.componentId);
    setDeleteModal({ isOpen: false, componentId: '', componentType: '' });
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, componentId: '', componentType: '' });
  };

  // Función mejorada para iniciar arrastre (mouse y touch)
  const handlePointerStart = (e: React.MouseEvent | React.TouchEvent, componentId: string) => {
    // Evitar arrastre si se hace clic en el botón de eliminar o en campos de entrada
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }

    const component = components.find(c => c.id === componentId);
    if (!component || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Obtener coordenadas unificadas (mouse o touch)
    let clientX: number, clientY: number;
    if ('touches' in e) {
      // Touch event
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const pointerX = clientX - canvasRect.left;
    const pointerY = clientY - canvasRect.top;

    // Guardar posición inicial para detectar movimiento
    setDragStartPosition({ x: pointerX, y: pointerY });
    setHasMoved(false);

    // Calcular el offset entre el pointer y la esquina superior izquierda del componente
    setDragOffset({
      x: pointerX - component.position.x,
      y: pointerY - component.position.y
    });

    setDraggingComponentId(componentId);

    // Agregar event listeners para movimiento y finalización
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      let currentX: number, currentY: number;
      
      if ('touches' in e) {
        // Touch event
        if (e.touches.length === 0) return;
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else {
        // Mouse event
        currentX = e.clientX;
        currentY = e.clientY;
      }
      
      const currentPointerX = currentX - canvasRect.left;
      const currentPointerY = currentY - canvasRect.top;

      // Calcular distancia desde la posición inicial
      const deltaX = Math.abs(currentPointerX - dragStartPosition.x);
      const deltaY = Math.abs(currentPointerY - dragStartPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Solo activar arrastre si se supera el umbral
      if (distance > DRAG_THRESHOLD && !hasMoved) {
        setHasMoved(true);
        setIsDragging(true);
        // Prevenir comportamiento por defecto solo cuando confirmamos que es un arrastre
        e.preventDefault();
        e.stopPropagation();
      }

      // Solo actualizar posición si estamos arrastrando
      if (hasMoved || distance > DRAG_THRESHOLD) {
        // Prevenir comportamiento por defecto durante el arrastre activo
        e.preventDefault();
        
      // Calcular nueva posición considerando el offset
      const canvasWidth = canvasRef.current.offsetWidth; // Obtener el ancho actual del canvas
      const canvasHeight = canvasRef.current.offsetHeight; // Obtener la altura actual del canvas
      const newX = Math.max(0, Math.min(currentPointerX - dragOffset.x, canvasWidth - component.fixedWidth));
      const newY = Math.max(0, Math.min(currentPointerY - dragOffset.y, canvasHeight - component.fixedHeight));

      onUpdateComponent(componentId, {
        position: { x: newX, y: newY }
      });
      }
    };

    const handlePointerEnd = () => {
      setDraggingComponentId(null);
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      setHasMoved(false);
      setDragStartPosition({ x: 0, y: 0 });
      
      // Remover todos los event listeners
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove as any);
      window.removeEventListener('touchend', handlePointerEnd);
      window.removeEventListener('touchcancel', handlePointerEnd);
    };

    // Agregar listeners para mouse y touch
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handlePointerMove as any, { passive: false });
    window.addEventListener('touchend', handlePointerEnd);
    window.addEventListener('touchcancel', handlePointerEnd);
  };

  return (
    <>
      <div
        ref={canvasRef} // minWidth se elimina para permitir que el canvas se adapte al 100% del ancho del padre
        className="w-full h-full min-h-[calc(100vh-120px)] bg-white rounded-lg relative overflow-y-auto overflow-x-auto shadow-lg touch-auto"
        // minWidth se elimina para permitir que el canvas se adapte al 100% del ancho del padre
        // y el arrastre se controla con el offsetWidth del canvas
      >
        {/* Componentes dinámicos */}
        {components.map(component => (
          <div 
            key={component.id}
            data-component-id={component.id}
            className={`absolute group select-none ${
              draggingComponentId === component.id && isDragging && hasMoved
                ? 'cursor-grabbing z-50' 
                : 'cursor-grab hover:shadow-lg'
            } transition-shadow duration-200`}
            style={{
              left: `${component.position.x}px`,
              top: `${component.position.y}px`,
              width: `${component.fixedWidth}px`, 
              height: `${component.fixedHeight}px`, 
              zIndex: draggingComponentId === component.id && hasMoved ? 50 : 10,
            }}
            onMouseDown={(e) => handlePointerStart(e, component.id)}
            onTouchStart={(e) => handlePointerStart(e, component.id)}
          >
            {/* Botón de eliminar FIJO - siempre visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(component.id, component.type);
              }}
              className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg z-[60] transition-colors duration-200 cursor-pointer"
              title="Eliminar componente"
            >
              <Trash2 size={10} className="sm:hidden" />
              <Trash2 size={12} className="hidden sm:block" />
            </button>

            {/* Indicador visual de arrastre */}
            {draggingComponentId === component.id && isDragging && hasMoved && (
              <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none" />
            )}

            {/* Contenido del componente */}
            <div 
              data-component-content
              className={isDragging && hasMoved ? "pointer-events-none" : "pointer-events-auto"}
            >
              {component.type === 'text' && (
                <TextComponent
                  content={component.content || ''}
                  fixedWidth={component.fixedWidth}
                  fixedHeight={component.fixedHeight}
                  onChange={(content) => onUpdateComponent(component.id, { content })}
                />
              )}
              {component.type === 'door' && (
                <DoorComponent
                  doorWidth={component.doorWidth || ''}
                  doorHeight={component.doorHeight || ''}
                  fixedWidth={component.fixedWidth}
                  fixedHeight={component.fixedHeight}
                  onDoorWidthChange={(doorWidth) => onUpdateComponent(component.id, { doorWidth })}
                  onDoorHeightChange={(doorHeight) => onUpdateComponent(component.id, { doorHeight })}
                />
              )}
              {component.type === 'fixed-sliding-window' && (
                <FixedSlidingWindowComponent 
                  fixedWidth={component.fixedWidth}
                  fixedHeight={component.fixedHeight}
                  windowWidth={component.windowWidth || ''}
                  windowHeight={component.windowHeight || ''}
                  onWindowWidthChange={(windowWidth) => onUpdateComponent(component.id, { windowWidth })}
                  onWindowHeightChange={(windowHeight) => onUpdateComponent(component.id, { windowHeight })}
                  onExport={() => handleExportClick(component.id, component.type)}
                />
              )}
              {component.type === 'double-sliding-window' && (
                <DoubleSlidingWindowComponent 
                  fixedWidth={component.fixedWidth}
                  fixedHeight={component.fixedHeight}
                  windowWidth={component.windowWidth || ''}
                  windowHeight={component.windowHeight || ''}
                  onWindowWidthChange={(windowWidth) => onUpdateComponent(component.id, { windowWidth })}
                  onWindowHeightChange={(windowHeight) => onUpdateComponent(component.id, { windowHeight })}
                  onExport={() => handleExportClick(component.id, component.type)}
                />
              )}
              {component.type === 'two-fixed-two-sliding-window' && (
                <TwoFixedTwoSlidingWindowComponent 
                  fixedWidth={component.fixedWidth}
                  fixedHeight={component.fixedHeight}
                  windowWidth={component.windowWidth || ''}
                  windowHeight={component.windowHeight || ''}
                  onWindowWidthChange={(windowWidth) => onUpdateComponent(component.id, { windowWidth })}
                  onWindowHeightChange={(windowHeight) => onUpdateComponent(component.id, { windowHeight })}
                  onExport={() => handleExportClick(component.id, component.type)}
                />
              )}
              {component.type === 'four-sliding-window' && (
                <FourSlidingWindowComponent 
                  fixedWidth={component.fixedWidth}
                  fixedHeight={component.fixedHeight}
                  windowWidth={component.windowWidth || ''}
                  windowHeight={component.windowHeight || ''}
                  onWindowWidthChange={(windowWidth) => onUpdateComponent(component.id, { windowWidth })}
                  onWindowHeightChange={(windowHeight) => onUpdateComponent(component.id, { windowHeight })}
                  onExport={() => handleExportClick(component.id, component.type)}
                />
              )}
              {component.type === 'glass' && (
                <GlassComponent 
                  fixedWidth={component.fixedWidth}
                  fixedHeight={component.fixedHeight}
                  glassWidth={component.glassWidth || ''}
                  glassHeight={component.glassHeight || ''}
                  onGlassWidthChange={(glassWidth) => onUpdateComponent(component.id, { glassWidth })}
                  onGlassHeightChange={(glassHeight) => onUpdateComponent(component.id, { glassHeight })}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        componentType={deleteModal.componentType}
      />
    </>
  );
}