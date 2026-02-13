import React, { useState } from 'react';
import { Settings, DoorOpen as Door, ClipboardList, NotebookPen } from 'lucide-react';
import { WindowIcon } from './components/WindowIcon';
import { WindowSubmenu } from './components/WindowTypes';
import { QuoteSubmenu } from './components/QuoteSubmenu';
import { WorkSubmenu } from './components/WorkSubmenu';
import { SettingsScreen } from './components/SettingsScreen';
import { NotesScreen } from './components/NotesScreen';
import { WindowCalculatorLine3 } from './components/WindowCalculatorLine3';
import { WindowCalculatorLine2 } from './components/WindowCalculatorLine2';
import { DoorCalculatorLine3 } from './components/DoorCalculatorLine3';
import { DoorCalculatorLine2 } from './components/DoorCalculatorLine2';
import { FixedSlidingQuoteCalculator } from './components/FixedSlidingQuoteCalculator';
import { DoubleSlidingQuoteCalculator } from './components/DoubleSlidingQuoteCalculator';
import { TwoFixedTwoSlidingQuoteCalculator } from './components/TwoFixedTwoSlidingQuoteCalculator';
import { FourSlidingQuoteCalculator } from './components/FourSlidingQuoteCalculator';
import { XXCalculator } from './components/XXCalculator';
import { TwoFixedTwoSlidingCalculator } from './components/TwoFixedTwoSlidingCalculator';
import { FourSlidingCalculator } from './components/FourSlidingCalculator';

type Screen = 'main' | 'windows' | 'doors' | 'quote' | 'work' | 'settings' | 'notes';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  
  const [navigateToCalculator, setNavigateToCalculator] = useState<{
    option: 'quote' | 'work';
    line: 'L3' | 'L2';
    componentType: 'door' | 'window';
    windowType?: string;
    width: string;
    height: string;
    fromNotes?: boolean;
  } | null>(null);

  const handleNavigateToCalculator = (
    option: 'quote' | 'work',
    line: 'L3' | 'L2',
    componentType: 'door' | 'window', 
    windowType?: string,
    width: string = '',
    height: string = ''
  ) => {
    setNavigateToCalculator({
      option,
      line,
      componentType,
      windowType,
      width,
      height
    });
    
    if (componentType === 'window') {
      setCurrentScreen('windows');
    } else {
      setCurrentScreen('doors');
    }
  };

  const handleNavigateFromNotes = (
    option: 'quote' | 'work',
    line: 'L3' | 'L2',
    componentType: 'door' | 'window',
    windowType?: string,
    width: string = '',
    height: string = ''
  ) => {
    setNavigateToCalculator({
      option,
      line,
      componentType,
      windowType,
      width,
      height,
      fromNotes: true
    });
    
    if (componentType === 'window') {
      setCurrentScreen('windows');
    } else {
      setCurrentScreen('doors');
    }
  };

  if (currentScreen === 'windows') {
    // Si hay datos de navegación y es para una ventana
    if (navigateToCalculator && navigateToCalculator.componentType === 'window') {
      const { option, line, windowType, width, height } = navigateToCalculator;
      
      // Limpiar el estado de navegación después de usarlo
      
      if (option === 'quote') {
        // Cotización
        if (line === 'L3') {
          // Cotización Línea 3
          if (windowType === 'fixed-sliding-window') {
            return (
              <FixedSlidingQuoteCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else if (windowType === 'double-sliding-window' || windowType === 'xx') {
            return (
              <DoubleSlidingQuoteCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else if (windowType === 'two-fixed-two-sliding-window' || windowType === 'fixed-sliding-sliding-fixed') {
            return (
              <TwoFixedTwoSlidingQuoteCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else if (windowType === 'four-sliding-window' || windowType === 'sliding-all') {
            return (
              <FourSlidingQuoteCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          }
        } else { // L2
          // Cotización Línea 2
          return (
            <WindowCalculatorLine2
              onBack={() => {
                setCurrentScreen('main');
                setNavigateToCalculator(null);
              }}
              initialWidth={width}
              initialHeight={height}
            />
          );
        }
      } else { // work
        // Trabajo
        if (line === 'L3') {
          // Trabajo Línea 3
          if (windowType === 'fixed-sliding-window') {
            return (
              <WindowCalculatorLine3
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else if (windowType === 'double-sliding-window' || windowType === 'xx') {
            return (
              <XXCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else if (windowType === 'two-fixed-two-sliding-window' || windowType === 'fixed-sliding-sliding-fixed') {
            return (
              <TwoFixedTwoSlidingCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else if (windowType === 'four-sliding-window' || windowType === 'sliding-all') {
            return (
              <FourSlidingCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          }
        } else { // L2
          // Trabajo Línea 2
          if (windowType === 'fixed-sliding-window') {
            return (
              <WindowCalculatorLine2
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else if (windowType === 'double-sliding-window' || windowType === 'xx' || windowType === 'sliding-sliding') {
            return (
              <XXCalculator
                onBack={() => {
                  setCurrentScreen('main');
                  setNavigateToCalculator(null);
                }}
                showNotesButton={navigateToCalculator?.fromNotes}
                onBackToNotes={() => {
                  setCurrentScreen('notes');
                  setNavigateToCalculator(null);
                }}
                initialWidth={width}
                initialHeight={height}
              />
            );
          } else {
            // Mostrar alerta y regresar a la pantalla principal para tipos no soportados
            setTimeout(() => {
              alert('Este tipo de ventana no está disponible para la Línea Nacional de 2');
              setCurrentScreen('main');
              setNavigateToCalculator(null);
            }, 100);
            return null;
          }
        }
      }
    }

    return (
      <WindowSubmenu
        onBack={() => setCurrentScreen('main')}
        onNavigateToCalculator={handleNavigateToCalculator}
      />
    );
  }

  if (currentScreen === 'doors') {
    // Si hay datos de navegación y es para una puerta
    if (navigateToCalculator && navigateToCalculator.componentType === 'door') {
      const { option, line, width, height } = navigateToCalculator;
      
      if (option === 'quote') {
        // Cotización de puerta
        if (line === 'L3') {
          return (
            <DoorCalculatorLine3
              onBack={() => {
                setCurrentScreen('main');
                setNavigateToCalculator(null);
              }}
              initialWidth={width}
              initialHeight={height}
            />
          );
        } else { // L2
          return (
            <DoorCalculatorLine2
              onBack={() => {
                setCurrentScreen('main');
                setNavigateToCalculator(null);
              }}
              initialWidth={width}
              initialHeight={height}
            />
          );
        }
      } else { // work
        // Trabajo de puerta
        if (line === 'L3') {
          return (
            <DoorCalculatorLine3
              onBack={() => {
                setCurrentScreen('main');
                setNavigateToCalculator(null);
              }}
              initialWidth={width}
              initialHeight={height}
            />
          );
        } else { // L2
          return (
            <DoorCalculatorLine2
              onBack={() => {
                setCurrentScreen('main');
                setNavigateToCalculator(null);
              }}
              initialWidth={width}
              initialHeight={height}
            />
          );
        }
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentScreen('main')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                ←
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Puertas</h1>
              <div className="w-10"></div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentScreen('quote')}
                className="w-full p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-3"
              >
                <ClipboardList size={24} />
                Cotización
              </button>
              
              <button
                onClick={() => setCurrentScreen('work')}
                className="w-full p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-3"
              >
                <NotebookPen size={24} />
                Trabajo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'quote') {
    return (
      <QuoteSubmenu
        onBack={() => setCurrentScreen('main')}
        onNavigateToCalculator={handleNavigateToCalculator}
      />
    );
  }

  if (currentScreen === 'work') {
    return (
      <WorkSubmenu
        onBack={() => setCurrentScreen('main')}
        onNavigateToCalculator={handleNavigateToCalculator}
      />
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        onBack={() => setCurrentScreen('main')}
      />
    );
  }

  if (currentScreen === 'notes') {
    return (
      <NotesScreen
        onBack={() => setCurrentScreen('main')}
        onNavigateToCalculator={handleNavigateFromNotes}
      />
    );
  }

  // Pantalla principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Calculadora de Aluminio
            </h1>
            <p className="text-gray-600">Selecciona una opción para comenzar</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setCurrentScreen('windows')}
              className="p-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex flex-col items-center gap-3"
            >
              <WindowIcon size={32} />
              <span className="font-semibold">Ventanas</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('doors')}
              className="p-6 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex flex-col items-center gap-3"
            >
              <Door size={32} />
              <span className="font-semibold">Puertas</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setCurrentScreen('quote')}
              className="p-6 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex flex-col items-center gap-3"
            >
              <ClipboardList size={32} />
              <span className="font-semibold">Cotización</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('work')}
              className="p-6 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex flex-col items-center gap-3"
            >
              <NotebookPen size={32} />
              <span className="font-semibold">Trabajo</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentScreen('notes')}
              className="p-6 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors flex flex-col items-center gap-3"
            >
              <NotebookPen size={32} />
              <span className="font-semibold">Notas</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('settings')}
              className="p-6 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors flex flex-col items-center gap-3"
            >
              <Settings size={32} />
              <span className="font-semibold">Configuración</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;