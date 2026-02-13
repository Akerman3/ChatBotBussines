import React, { useState, useEffect } from 'react';
import { X, Trash2, TrendingUp, Calendar, Layers, Clock } from 'lucide-react';
import { loadLearningSessions, deleteLearningSession, deleteAllLearningSessions, LearningSession } from '../utils/learningDB';
import { getLearnedPatterns, getInsights } from '../utils/learningPatterns';

interface SavedLearningSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedLearningSessionsModal({ isOpen, onClose }: SavedLearningSessionsModalProps) {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [showPatterns, setShowPatterns] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    const loadedSessions = await loadLearningSessions();
    setSessions(loadedSessions);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta sesión?')) {
      const result = await deleteLearningSession(id);
      if (result.success) {
        loadSessions();
      } else {
        alert(result.message);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las sesiones? Esta acción no se puede deshacer.')) {
      const result = await deleteAllLearningSessions();
      if (result.success) {
        loadSessions();
        alert(result.message);
      } else {
        alert(result.message);
      }
    }
  };

  const handleViewPatterns = () => {
    setShowPatterns(true);
  };

  if (!isOpen) return null;

  const patterns = sessions.length >= 3 ? getLearnedPatterns(sessions) : null;
  const insights = patterns ? getInsights(patterns) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#003366]">
            Historial de Entrenamiento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Cargando sesiones...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No hay sesiones guardadas</div>
              <div className="text-gray-400 text-sm">
                Comienza a entrenar el sistema colocando piezas manualmente
              </div>
            </div>
          ) : (
            <>
              {sessions.length >= 3 && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        <TrendingUp className="text-blue-600" size={20} />
                        Patrones Detectados
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        El sistema ha analizado {sessions.length} sesiones y detectó estos patrones
                      </p>
                    </div>
                    <button
                      onClick={handleViewPatterns}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      {showPatterns ? 'Ocultar' : 'Ver Detalles'}
                    </button>
                  </div>

                  {showPatterns && patterns && (
                    <div className="space-y-2 mt-3 border-t border-blue-200 pt-3">
                      {insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                          <span className="mt-0.5">•</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                      <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-900">
                        <strong>Confianza del sistema:</strong> {patterns.confidence.toFixed(0)}%
                        {patterns.confidence < 50 && ' - Se necesitan más sesiones para mejorar la precisión'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">
                  Sesiones guardadas ({sessions.length})
                </h3>
                <button
                  onClick={handleDeleteAll}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Eliminar Todas
                </button>
              </div>

              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedSession?.id === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {session.session_name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(session.created_at!).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers size={14} />
                            {session.total_pieces} piezas
                          </span>
                          {session.session_duration && session.session_duration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {Math.floor(session.session_duration / 60)}m {session.session_duration % 60}s
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.id!);
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="bg-gray-100 p-2 rounded text-center">
                        <div className="text-xs text-gray-600">Placa</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {session.plate_width} × {session.plate_height} cm
                        </div>
                      </div>
                      <div className="bg-green-100 p-2 rounded text-center">
                        <div className="text-xs text-green-600">Aprovechamiento</div>
                        <div className="text-sm font-semibold text-green-800">
                          {session.utilization_percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-red-100 p-2 rounded text-center">
                        <div className="text-xs text-red-600">Desperdicio</div>
                        <div className="text-sm font-semibold text-red-800">
                          {(session.total_waste / 10000).toFixed(2)} m²
                        </div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-center">
                        <div className="text-xs text-blue-600">Piezas Rotadas</div>
                        <div className="text-sm font-semibold text-blue-800">
                          {session.pieces_data.filter(p => p.rotated).length}
                        </div>
                      </div>
                    </div>

                    {selectedSession?.id === session.id && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">
                          Detalles de Piezas:
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {session.pieces_data
                            .sort((a, b) => a.placementOrder - b.placementOrder)
                            .map((piece, idx) => (
                              <div
                                key={piece.id}
                                className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                              >
                                <div className="font-semibold">
                                  #{piece.placementOrder}: {piece.width.toFixed(1)} × {piece.height.toFixed(1)} cm
                                </div>
                                <div className="text-gray-600">
                                  Pos: ({piece.x.toFixed(0)}, {piece.y.toFixed(0)})
                                  {piece.rotated && <span className="ml-1 text-purple-600">↻</span>}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
