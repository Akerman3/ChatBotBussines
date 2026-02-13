import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, FolderOpen, RotateCcw, TrendingUp, Brain } from 'lucide-react';
import { InteractivePlateCanvas } from './InteractivePlateCanvas';
import { PlacedPieceData, saveLearningSession, getLearningStatistics, calculateUtilization } from '../utils/learningDB';
import { getLearnedPatterns, getInsights } from '../utils/learningPatterns';
import { CutRequest } from '../utils/glassProjectsDB';
import { SavedLearningSessionsModal } from './SavedLearningSessionsModal';

interface GlassLearningModeProps {
  onBack: () => void;
}

export function GlassLearningMode({ onBack }: GlassLearningModeProps) {
  const [plateWidth, setPlateWidth] = useState('260');
  const [plateHeight, setPlateHeight] = useState('180');
  const [cutWidth, setCutWidth] = useState('');
  const [cutHeight, setCutHeight] = useState('');
  const [pieces, setPieces] = useState<CutRequest[]>([]);
  const [placedPieces, setPlacedPieces] = useState<PlacedPieceData[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [statistics, setStatistics] = useState({
    totalSessions: 0,
    averageUtilization: 0,
    totalPiecesPlaced: 0,
    averagePiecesPerSession: 0
  });
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    const stats = await getLearningStatistics();
    setStatistics(stats);
  };

  const handleAddPiece = () => {
    const width = parseFloat(cutWidth);
    const height = parseFloat(cutHeight);

    if (!cutWidth || !cutHeight) {
      alert('Por favor ingresa ancho y alto de la pieza');
      return;
    }

    if (isNaN(width) || width <= 0) {
      alert('El ancho debe ser un número positivo');
      return;
    }

    if (isNaN(height) || height <= 0) {
      alert('El alto debe ser un número positivo');
      return;
    }

    const newPiece: CutRequest = {
      id: crypto.randomUUID(),
      width,
      height,
      quantity: 1
    };

    setPieces([...pieces, newPiece]);
    setCutWidth('');
    setCutHeight('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPiece();
    }
  };

  const handleRemovePiece = (id: string) => {
    setPieces(pieces.filter(p => p.id !== id));
    setPlacedPieces(placedPieces.filter(p => p.id !== id));
  };

  const handlePiecePlaced = (piece: PlacedPieceData) => {
    setPlacedPieces(prev => {
      const existing = prev.find(p => p.id === piece.id);
      if (existing) {
        return prev.map(p => p.id === piece.id ? piece : p);
      }
      return [...prev, piece];
    });
  };

  const handlePieceRemoved = (pieceId: string) => {
    setPlacedPieces(prev => prev.filter(p => p.id !== pieceId));
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres reiniciar? Se perderán todas las piezas colocadas.')) {
      setPlacedPieces([]);
    }
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todo? Se perderán todas las piezas.')) {
      setPieces([]);
      setPlacedPieces([]);
      setSessionName('');
    }
  };

  const handleSaveSession = async () => {
    if (placedPieces.length === 0) {
      alert('No hay piezas colocadas para guardar');
      return;
    }

    if (placedPieces.length !== pieces.length) {
      alert('Debes colocar todas las piezas antes de guardar la sesión');
      return;
    }

    const name = sessionName.trim() || `Sesión ${new Date().toLocaleString()}`;

    const { utilization, waste } = calculateUtilization(
      placedPieces,
      parseFloat(plateWidth),
      parseFloat(plateHeight)
    );

    const duration = Math.floor((Date.now() - startTime) / 1000);

    const result = await saveLearningSession({
      session_name: name,
      plate_width: parseFloat(plateWidth),
      plate_height: parseFloat(plateHeight),
      pieces_data: placedPieces,
      placement_order: placedPieces
        .sort((a, b) => a.placementOrder - b.placementOrder)
        .map(p => p.id),
      total_pieces: placedPieces.length,
      utilization_percentage: utilization,
      total_waste: waste,
      session_duration: duration
    });

    if (result.success) {
      alert(result.message);
      loadStatistics();
      handleClearAll();
    } else {
      alert(result.message);
    }
  };

  const pendingPieces = pieces.filter(p => !placedPieces.some(placed => placed.id === p.id));

  const currentUtilization = placedPieces.length > 0
    ? calculateUtilization(placedPieces, parseFloat(plateWidth), parseFloat(plateHeight))
    : { utilization: 0, waste: 0 };

  return (
    <div className="min-h-screen bg-[#003366] pb-8">
      <div className="w-full pt-6 px-6">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="text-center my-6">
        <h1 className="text-white text-4xl font-bold flex items-center justify-center gap-3">
          <Brain size={40} />
          APRENDIZAJE DE CORTA VIDRIOS
        </h1>
        <p className="text-gray-300 mt-2">Entrena el sistema con tu forma de acomodar piezas</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#003366]">Estadísticas de Entrenamiento</h2>
            <button
              onClick={() => setShowLoadModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FolderOpen size={18} />
              Ver Historial
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">
                {statistics.totalSessions}
              </div>
              <div className="text-sm text-gray-600 mt-1">Sesiones Guardadas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {statistics.averageUtilization.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Aprovechamiento Promedio</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">
                {statistics.totalPiecesPlaced}
              </div>
              <div className="text-sm text-gray-600 mt-1">Piezas Colocadas</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">
                {statistics.averagePiecesPerSession.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Piezas por Sesión</div>
            </div>
          </div>

          {statistics.totalSessions >= 3 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={20} />
                <h3 className="font-semibold text-green-800">Sistema Aprendiendo</h3>
              </div>
              <p className="text-sm text-green-700">
                Has completado {statistics.totalSessions} sesiones. El sistema está analizando tus patrones de acomodamiento.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-[#003366] mb-4">Configuración</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Dimensiones de Placa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho (cm)
                  </label>
                  <input
                    type="number"
                    value={plateWidth}
                    onChange={(e) => setPlateWidth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                    placeholder="260"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alto (cm)
                  </label>
                  <input
                    type="number"
                    value={plateHeight}
                    onChange={(e) => setPlateHeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                    placeholder="180"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Agregar Pieza</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={cutWidth}
                  onChange={(e) => setCutWidth(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  placeholder="Ancho"
                />
                <input
                  type="number"
                  step="0.01"
                  value={cutHeight}
                  onChange={(e) => setCutHeight(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  placeholder="Alto"
                />
                <button
                  onClick={handleAddPiece}
                  className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {pieces.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                Piezas ({placedPieces.length}/{pieces.length} colocadas)
              </h3>
              <div className="flex flex-wrap gap-2">
                {pieces.map((piece, idx) => {
                  const isPlaced = placedPieces.some(p => p.id === piece.id);
                  return (
                    <div
                      key={piece.id}
                      className={`px-3 py-2 rounded ${
                        isPlaced ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'
                      } border flex items-center gap-2`}
                    >
                      <span className="text-sm">
                        #{idx + 1}: {piece.width} × {piece.height} cm
                      </span>
                      <button
                        onClick={() => handleRemovePiece(piece.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {pieces.length > 0 && (
          <>
            <InteractivePlateCanvas
              plateWidth={parseFloat(plateWidth)}
              plateHeight={parseFloat(plateHeight)}
              pendingPieces={pendingPieces}
              placedPieces={placedPieces}
              onPiecePlaced={handlePiecePlaced}
              onPieceRemoved={handlePieceRemoved}
            />

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#003366] mb-4">Progreso Actual</h2>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {placedPieces.length}/{pieces.length}
                  </div>
                  <div className="text-sm text-gray-600">Piezas Colocadas</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentUtilization.utilization.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Aprovechamiento</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {(currentUtilization.waste / 10000).toFixed(2)} m²
                  </div>
                  <div className="text-sm text-gray-600">Desperdicio</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Sesión (opcional)
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  placeholder="Mi sesión de entrenamiento"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveSession}
                  disabled={placedPieces.length !== pieces.length}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  Guardar Sesión de Entrenamiento
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={20} />
                  Reiniciar
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Limpiar Todo
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <SavedLearningSessionsModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
      />
    </div>
  );
}
