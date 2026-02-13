import React from 'react';
import { CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, RotateCcw } from 'lucide-react';
import { PlateOrientation } from '../utils/glassProjectsDB';
import { getOrientationLabel, getOrientationDescription } from '../utils/plateTransformations';

interface PlateOrientationSelectorProps {
  selectedOrientation: PlateOrientation;
  onOrientationChange: (orientation: PlateOrientation) => void;
}

interface OrientationOption {
  value: PlateOrientation;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function PlateOrientationSelector({
  selectedOrientation,
  onOrientationChange
}: PlateOrientationSelectorProps) {
  const orientations: OrientationOption[] = [
    {
      value: 'TOP_LEFT',
      label: 'Superior Izquierda',
      icon: <CornerUpLeft size={24} />,
      description: getOrientationDescription('TOP_LEFT')
    },
    {
      value: 'TOP_RIGHT',
      label: 'Superior Derecha',
      icon: <CornerUpRight size={24} />,
      description: getOrientationDescription('TOP_RIGHT')
    },
    {
      value: 'BOTTOM_LEFT',
      label: 'Inferior Izquierda',
      icon: <CornerDownLeft size={24} />,
      description: getOrientationDescription('BOTTOM_LEFT')
    },
    {
      value: 'BOTTOM_RIGHT',
      label: 'Inferior Derecha',
      icon: <CornerDownRight size={24} />,
      description: getOrientationDescription('BOTTOM_RIGHT')
    }
  ];

  const handleReset = () => {
    onOrientationChange('TOP_LEFT');
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#003366] mb-1">
            Orientación de Corte
          </h3>
          <p className="text-sm text-gray-600">
            Elige desde qué esquina comenzar a cortar
          </p>
        </div>
        {selectedOrientation !== 'TOP_LEFT' && (
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm"
            title="Restablecer a orientación original"
          >
            <RotateCcw size={16} />
            Restablecer
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {orientations.map((orientation) => (
          <button
            key={orientation.value}
            onClick={() => onOrientationChange(orientation.value)}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${
                selectedOrientation === orientation.value
                  ? 'border-[#003366] bg-blue-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-sm'
              }
            `}
            title={orientation.description}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={`
                  p-3 rounded-full transition-colors
                  ${
                    selectedOrientation === orientation.value
                      ? 'bg-[#003366] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
              >
                {orientation.icon}
              </div>
              <span
                className={`
                  text-sm font-semibold text-center
                  ${
                    selectedOrientation === orientation.value
                      ? 'text-[#003366]'
                      : 'text-gray-700'
                  }
                `}
              >
                {orientation.label}
              </span>
            </div>

            {selectedOrientation === orientation.value && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Orientación actual: </span>
          {getOrientationLabel(selectedOrientation)}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          {getOrientationDescription(selectedOrientation)}
        </p>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-xs text-yellow-800">
          <span className="font-semibold">Nota:</span> La orientación no afecta la optimización,
          solo cambia desde qué esquina comenzarás a cortar. Elige la más cómoda para tu equipo.
        </p>
      </div>
    </div>
  );
}
