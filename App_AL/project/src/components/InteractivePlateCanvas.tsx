import React, { useState, useRef } from 'react';
import { RotateCw, X } from 'lucide-react';
import { PlacedPieceData } from '../utils/learningDB';
import { CutRequest } from '../utils/glassProjectsDB';

interface InteractivePlateCanvasProps {
  plateWidth: number;
  plateHeight: number;
  pendingPieces: CutRequest[];
  placedPieces: PlacedPieceData[];
  onPiecePlaced: (piece: PlacedPieceData) => void;
  onPieceRemoved: (pieceId: string) => void;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
];

export function InteractivePlateCanvas({
  plateWidth,
  plateHeight,
  pendingPieces,
  placedPieces,
  onPiecePlaced,
  onPieceRemoved
}: InteractivePlateCanvasProps) {
  const [draggedPiece, setDraggedPiece] = useState<CutRequest | null>(null);
  const [draggedPlacedPiece, setDraggedPlacedPiece] = useState<PlacedPieceData | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [isRotated, setIsRotated] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const containerWidth = 800;
  const containerHeight = 500;

  const scaleX = containerWidth / plateWidth;
  const scaleY = containerHeight / plateHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  const scaledPlateWidth = plateWidth * scale;
  const scaledPlateHeight = plateHeight * scale;

  const offsetX = (containerWidth - scaledPlateWidth) / 2;
  const offsetY = (containerHeight - scaledPlateHeight) / 2;

  const checkCollision = (x: number, y: number, width: number, height: number, excludeId?: string): boolean => {
    if (x < 0 || y < 0 || x + width > plateWidth || y + height > plateHeight) {
      return true;
    }

    return placedPieces.some(piece => {
      if (excludeId && piece.id === excludeId) return false;

      const overlapX = x < piece.x + piece.width && x + width > piece.x;
      const overlapY = y < piece.y + piece.height && y + height > piece.y;

      return overlapX && overlapY;
    });
  };

  const handleDragStart = (piece: CutRequest, e: React.DragEvent) => {
    setDraggedPiece(piece);
    setIsRotated(false);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePlacedPieceDragStart = (piece: PlacedPieceData, e: React.DragEvent) => {
    setDraggedPlacedPiece(piece);
    setIsRotated(piece.rotated);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - offsetX;
    const mouseY = e.clientY - rect.top - offsetY;

    const realX = mouseX / scale;
    const realY = mouseY / scale;

    setDragPosition({ x: realX, y: realY });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!canvasRef.current || (!draggedPiece && !draggedPlacedPiece)) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - offsetX;
    const mouseY = e.clientY - rect.top - offsetY;

    const realX = mouseX / scale;
    const realY = mouseY / scale;

    const width = draggedPlacedPiece
      ? (isRotated ? draggedPlacedPiece.originalHeight : draggedPlacedPiece.originalWidth)
      : (draggedPiece ? (isRotated ? draggedPiece.height : draggedPiece.width) : 0);

    const height = draggedPlacedPiece
      ? (isRotated ? draggedPlacedPiece.originalWidth : draggedPlacedPiece.originalHeight)
      : (draggedPiece ? (isRotated ? draggedPiece.width : draggedPiece.height) : 0);

    if (draggedPlacedPiece) {
      const hasCollision = checkCollision(realX, realY, width, height, draggedPlacedPiece.id);

      if (!hasCollision) {
        const updatedPiece: PlacedPieceData = {
          ...draggedPlacedPiece,
          x: realX,
          y: realY,
          width: width,
          height: height,
          rotated: isRotated
        };

        onPieceRemoved(draggedPlacedPiece.id);
        onPiecePlaced(updatedPiece);
      }
    } else if (draggedPiece) {
      const hasCollision = checkCollision(realX, realY, width, height);

      if (!hasCollision) {
        const newPiece: PlacedPieceData = {
          id: draggedPiece.id,
          x: realX,
          y: realY,
          width: width,
          height: height,
          rotated: isRotated,
          originalWidth: draggedPiece.width,
          originalHeight: draggedPiece.height,
          placementOrder: placedPieces.length + 1
        };

        onPiecePlaced(newPiece);
      }
    }

    setDraggedPiece(null);
    setDraggedPlacedPiece(null);
    setDragPosition(null);
    setIsRotated(false);
  };

  const handleDragLeave = () => {
    setDragPosition(null);
  };

  const handleRotateToggle = () => {
    setIsRotated(!isRotated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') {
      handleRotateToggle();
    }
  };

  const renderDragPreview = () => {
    if (!dragPosition || (!draggedPiece && !draggedPlacedPiece)) return null;

    const width = draggedPiece
      ? (isRotated ? draggedPiece.height : draggedPiece.width)
      : (isRotated ? draggedPlacedPiece!.originalHeight : draggedPlacedPiece!.originalWidth);

    const height = draggedPiece
      ? (isRotated ? draggedPiece.width : draggedPiece.height)
      : (isRotated ? draggedPlacedPiece!.originalWidth : draggedPlacedPiece!.originalHeight);

    const hasCollision = checkCollision(
      dragPosition.x,
      dragPosition.y,
      width,
      height,
      draggedPlacedPiece?.id
    );

    return (
      <div
        style={{
          position: 'absolute',
          left: `${offsetX + dragPosition.x * scale}px`,
          top: `${offsetY + dragPosition.y * scale}px`,
          width: `${width * scale}px`,
          height: `${height * scale}px`,
          backgroundColor: hasCollision ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)',
          border: `2px dashed ${hasCollision ? '#DC2626' : '#059669'}`,
          pointerEvents: 'none',
          zIndex: 1000
        }}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex gap-6">
        <div className="flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Piezas Pendientes ({pendingPieces.length})
          </h3>
          <div className="space-y-2 w-48 max-h-[500px] overflow-y-auto p-2 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            {pendingPieces.map((piece, index) => (
              <div
                key={piece.id}
                draggable
                onDragStart={(e) => handleDragStart(piece, e)}
                className="p-3 bg-blue-100 border-2 border-blue-300 rounded cursor-move hover:bg-blue-200 transition-colors"
              >
                <div className="text-sm font-semibold text-blue-900">
                  Pieza #{index + 1}
                </div>
                <div className="text-xs text-blue-700">
                  {piece.width} × {piece.height} cm
                </div>
              </div>
            ))}
            {pendingPieces.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                Todas las piezas colocadas
              </div>
            )}
          </div>
          {(draggedPiece || draggedPlacedPiece) && (
            <button
              onClick={handleRotateToggle}
              className="mt-3 w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw size={16} />
              Rotar (R)
              {isRotated && ' ✓'}
            </button>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Placa de Vidrio ({plateWidth} × {plateHeight} cm)
          </h3>
          <div
            ref={canvasRef}
            className="relative border-4 border-gray-300 rounded-lg"
            style={{
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
              backgroundColor: '#F9FAFB'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div
              className="absolute bg-white border-2 border-gray-400"
              style={{
                left: `${offsetX}px`,
                top: `${offsetY}px`,
                width: `${scaledPlateWidth}px`,
                height: `${scaledPlateHeight}px`
              }}
            >
              <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono">
                0, 0
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 font-mono">
                {plateWidth}, {plateHeight}
              </div>

              {placedPieces.map((piece, index) => (
                <div
                  key={piece.id}
                  draggable
                  onDragStart={(e) => handlePlacedPieceDragStart(piece, e)}
                  className="absolute border-2 border-gray-700 cursor-move hover:opacity-80 transition-opacity group"
                  style={{
                    left: `${piece.x * scale}px`,
                    top: `${piece.y * scale}px`,
                    width: `${piece.width * scale}px`,
                    height: `${piece.height * scale}px`,
                    backgroundColor: COLORS[index % COLORS.length] + 'CC'
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-bold">
                    <div>#{piece.placementOrder}</div>
                    <div>{piece.width.toFixed(1)} × {piece.height.toFixed(1)}</div>
                    {piece.rotated && <div className="text-yellow-300">↻</div>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rotatedPiece: PlacedPieceData = {
                        ...piece,
                        width: piece.height,
                        height: piece.width,
                        rotated: !piece.rotated
                      };
                      const hasCollision = checkCollision(rotatedPiece.x, rotatedPiece.y, rotatedPiece.width, rotatedPiece.height, piece.id);
                      if (!hasCollision) {
                        onPieceRemoved(piece.id);
                        onPiecePlaced(rotatedPiece);
                      } else {
                        alert('No hay espacio suficiente para rotar la pieza en esta posición');
                      }
                    }}
                    className="absolute top-1 left-1 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors z-10"
                    title="Rotar pieza"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPieceRemoved(piece.id);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-10"
                    title="Eliminar pieza"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {renderDragPreview()}
            </div>

            <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
              Arrastra las piezas aquí. Presiona R para rotar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
