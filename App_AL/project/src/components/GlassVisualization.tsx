import React from 'react';
import { RotateCw, Scissors, MapPin } from 'lucide-react';
import { PlateOptimization, PlacedPiece, PlateOrientation } from '../utils/glassProjectsDB';
import { transformPlacedPieces, transformWasteAreas, getOrientationLabel } from '../utils/plateTransformations';

interface GlassVisualizationProps {
  plate: PlateOptimization;
  plateWidth: number;
  plateHeight: number;
  orientation?: PlateOrientation;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
];

interface GuillotineCut {
  type: 'vertical' | 'horizontal';
  position: number;
  from: number;
  to: number;
}

function generateGuillotineCuts(pieces: PlacedPiece[], plateWidth: number, plateHeight: number): GuillotineCut[] {
  const cuts: GuillotineCut[] = [];

  const strips: Map<number, { height: number; pieces: PlacedPiece[] }> = new Map();
  for (const piece of pieces) {
    if (!strips.has(piece.y)) {
      strips.set(piece.y, { height: piece.height, pieces: [] });
    }
    strips.get(piece.y)!.pieces.push(piece);
  }

  const sortedStrips = Array.from(strips.entries()).sort((a, b) => a[0] - b[0]);

  for (let i = 0; i < sortedStrips.length; i++) {
    const [stripY, stripData] = sortedStrips[i];

    if (i > 0) {
      cuts.push({
        type: 'horizontal',
        position: stripY,
        from: 0,
        to: plateWidth
      });
    }

    const sortedPieces = stripData.pieces.sort((a, b) => a.x - b.x);
    for (let j = 0; j < sortedPieces.length; j++) {
      const piece = sortedPieces[j];

      if (j > 0) {
        cuts.push({
          type: 'vertical',
          position: piece.x,
          from: stripY,
          to: stripY + stripData.height
        });
      }
    }
  }

  return cuts;
}

export function GlassVisualization({ plate, plateWidth, plateHeight, orientation = 'TOP_LEFT' }: GlassVisualizationProps) {
  const containerWidth = 800;
  const containerHeight = 500;

  const scaleX = containerWidth / plateWidth;
  const scaleY = containerHeight / plateHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledPlateWidth = plateWidth * scale;
  const scaledPlateHeight = plateHeight * scale;

  const offsetX = (containerWidth - scaledPlateWidth) / 2;
  const offsetY = (containerHeight - scaledPlateHeight) / 2;

  const transformedPieces = transformPlacedPieces(plate.pieces, plateWidth, plateHeight, orientation);
  const transformedWasteAreas = transformWasteAreas(plate.wasteAreas, plateWidth, plateHeight, orientation);
  const guillotineCuts = generateGuillotineCuts(transformedPieces, plateWidth, plateHeight);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-[#003366]">
          Placa #{plate.plateNumber}
        </h3>
        <div className="flex gap-4 text-sm">
          <div className="bg-green-100 px-3 py-1 rounded">
            <span className="font-semibold text-green-800">Aprovechamiento: </span>
            <span className="text-green-900">{plate.utilization.toFixed(1)}%</span>
          </div>
          <div className="bg-red-100 px-3 py-1 rounded">
            <span className="font-semibold text-red-800">Desperdicio: </span>
            <span className="text-red-900">{plate.wastePercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div
        className="relative border-4 border-gray-800 bg-gray-50 mx-auto"
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`
        }}
      >
        <svg
          width={containerWidth}
          height={containerHeight}
          className="absolute top-0 left-0"
        >
          <rect
            x={offsetX}
            y={offsetY}
            width={scaledPlateWidth}
            height={scaledPlateHeight}
            fill="white"
            stroke="#1F2937"
            strokeWidth="2"
          />

          {transformedWasteAreas.map((waste, idx) => {
            const wasteArea = waste.width * waste.height;
            const isReusable = wasteArea >= 2000;
            return (
              <g key={`waste-${idx}`}>
                <rect
                  x={offsetX + waste.x * scale}
                  y={offsetY + waste.y * scale}
                  width={waste.width * scale}
                  height={waste.height * scale}
                  fill={isReusable ? "url(#reusableWastePattern)" : "url(#wastePattern)"}
                  opacity="0.5"
                />
                {isReusable && (
                  <text
                    x={offsetX + (waste.x + waste.width / 2) * scale}
                    y={offsetY + (waste.y + waste.height / 2) * scale}
                    textAnchor="middle"
                    className="font-semibold"
                    fill="#059669"
                    fontSize="12"
                    style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
                  >
                    ✓ Reutilizable
                  </text>
                )}
              </g>
            );
          })}

          <defs>
            <pattern id="wastePattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="10" y2="10" stroke="#EF4444" strokeWidth="1" />
              <line x1="10" y1="0" x2="0" y2="10" stroke="#EF4444" strokeWidth="1" />
            </pattern>
            <pattern id="reusableWastePattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="10" y2="10" stroke="#10B981" strokeWidth="1.5" />
              <line x1="10" y1="0" x2="0" y2="10" stroke="#10B981" strokeWidth="1.5" />
            </pattern>
          </defs>

          {transformedPieces.map((piece, idx) => {
            const color = COLORS[idx % COLORS.length];
            const x = offsetX + piece.x * scale;
            const y = offsetY + piece.y * scale;
            const w = piece.width * scale;
            const h = piece.height * scale;

            return (
              <g key={piece.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={color}
                  stroke="#1F2937"
                  strokeWidth="2"
                  opacity="0.8"
                />

                <text
                  x={x + w / 2}
                  y={y + h / 2 - 15}
                  textAnchor="middle"
                  className="font-bold"
                  fill="white"
                  fontSize="16"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  #{idx + 1}
                </text>

                <text
                  x={x + w / 2}
                  y={y + h / 2 + 5}
                  textAnchor="middle"
                  className="font-semibold"
                  fill="white"
                  fontSize="14"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {piece.width.toFixed(1)} × {piece.height.toFixed(1)} cm
                </text>

                {piece.rotated && (
                  <g>
                    <circle
                      cx={x + w - 20}
                      cy={y + 20}
                      r="12"
                      fill="white"
                      opacity="0.9"
                    />
                    <text
                      x={x + w - 20}
                      y={y + 25}
                      textAnchor="middle"
                      fontSize="16"
                      fill={color}
                    >
                      ↻
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {guillotineCuts.map((cut, idx) => {
            if (cut.type === 'horizontal') {
              const y = offsetY + cut.position * scale;
              const x1 = offsetX + cut.from * scale;
              const x2 = offsetX + cut.to * scale;
              return (
                <g key={`cut-${idx}`}>
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity="0.8"
                  />
                  <circle cx={x1 + 10} cy={y} r="8" fill="#DC2626" opacity="0.9" />
                  <text
                    x={x1 + 10}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    fontWeight="bold"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            } else {
              const x = offsetX + cut.position * scale;
              const y1 = offsetY + cut.from * scale;
              const y2 = offsetY + cut.to * scale;
              return (
                <g key={`cut-${idx}`}>
                  <line
                    x1={x}
                    y1={y1}
                    x2={x}
                    y2={y2}
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity="0.8"
                  />
                  <circle cx={x} cy={y1 + 10} r="8" fill="#DC2626" opacity="0.9" />
                  <text
                    x={x}
                    y={y1 + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    fontWeight="bold"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            }
          })}
        </svg>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-semibold text-gray-700 mb-2">Dimensiones de Placa</h4>
          <p className="text-gray-600">{plateWidth} cm × {plateHeight} cm</p>
          <p className="text-sm text-gray-500 mt-1">Área total: {(plateWidth * plateHeight / 10000).toFixed(2)} m²</p>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-semibold text-gray-700 mb-2">Piezas Colocadas</h4>
          <p className="text-gray-600">{plate.pieces.length} piezas</p>
          <p className="text-sm text-gray-500 mt-1">
            {plate.pieces.filter(p => p.rotated).length} rotadas
          </p>
        </div>
      </div>

      {orientation !== 'TOP_LEFT' && (
        <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-green-600" />
            <span className="font-semibold text-green-900">
              Esquina de inicio: {getOrientationLabel(orientation)}
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Los cortes están orientados para comenzar desde esta esquina
          </p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Scissors size={18} className="text-blue-600" />
          <span className="font-semibold text-blue-900">Leyenda</span>
        </div>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Cada color representa una pieza diferente</p>
          <p>• El símbolo ↻ indica que la pieza fue rotada 90° para optimizar espacio</p>
          <p>• Las áreas rayadas en <span className="text-green-600 font-semibold">verde</span> son sobrantes grandes reutilizables (≥ 2000 cm²)</p>
          <p>• Las áreas rayadas en <span className="text-red-600 font-semibold">rojo</span> son desperdicios pequeños fragmentados</p>
          <p>• Las líneas rojas punteadas muestran los cortes guillotina necesarios</p>
          <p>• Los números en círculos rojos indican el orden de los cortes</p>
        </div>
      </div>
    </div>
  );
}
