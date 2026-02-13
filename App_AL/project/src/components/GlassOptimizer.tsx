import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Calculator, Save, FolderOpen, FileText, ChevronLeft, ChevronRight, Repeat, Info, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { enhancedOptimizeGlassCutting, getOptimizationInsights, EnhancedOptimizationResult } from '../utils/enhancedGlassOptimizer';
import { CutRequest, OptimizationResult, GlassProject, PlateOrientation } from '../utils/glassProjectsDB';
import { QualityScore } from '../utils/optimizationScoring';
import { GlassVisualization } from './GlassVisualization';
import { CuttingInstructions } from './CuttingInstructions';
import { SaveGlassProjectModal } from './SaveGlassProjectModal';
import { SavedGlassProjectsModal } from './SavedGlassProjectsModal';
import { ExportGlassReportModal } from './ExportGlassReportModal';
import { PlateOrientationSelector } from './PlateOrientationSelector';

interface GlassOptimizerProps {
  onBack: () => void;
}

export function GlassOptimizer({ onBack }: GlassOptimizerProps) {
  const [plateWidth, setPlateWidth] = useState('260');
  const [plateHeight, setPlateHeight] = useState('180');
  const [cutWidth, setCutWidth] = useState('');
  const [cutHeight, setCutHeight] = useState('');
  const [cutQuantity, setCutQuantity] = useState('1');
  const [cuts, setCuts] = useState<CutRequest[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [alternativeResults, setAlternativeResults] = useState<OptimizationResult[]>([]);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedOptimizationResult | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [showValidation, setShowValidation] = useState(false);
  const [optimizationContext, setOptimizationContext] = useState<'PRODUCTION' | 'EXPENSIVE_MATERIAL' | 'QUICK_CUT' | 'BALANCED'>('BALANCED');
  const [currentPlateView, setCurrentPlateView] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [projectName, setProjectName] = useState('Proyecto sin nombre');
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [plateOrientation, setPlateOrientation] = useState<PlateOrientation>('TOP_LEFT');

  const handleAddCut = () => {
    const width = parseFloat(cutWidth);
    const height = parseFloat(cutHeight);
    const quantity = parseInt(cutQuantity);

    if (!cutWidth || !cutHeight) {
      alert('Por favor ingresa ancho y alto del corte');
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

    if (!cutQuantity || isNaN(quantity) || quantity <= 0) {
      alert('La cantidad debe ser un número entero positivo');
      return;
    }

    const plateW = parseFloat(plateWidth);
    const plateH = parseFloat(plateHeight);

    if (width > plateW && height > plateH) {
      alert(`La pieza (${width} × ${height} cm) es más grande que la placa (${plateW} × ${plateH} cm) incluso rotada. Por favor verifica las medidas.`);
      return;
    }

    const newCut: CutRequest = {
      id: crypto.randomUUID(),
      width,
      height,
      quantity
    };

    setCuts([...cuts, newCut]);
    setCutWidth('');
    setCutHeight('');
    setCutQuantity('1');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddCut();
    }
  };

  const handleRemoveCut = (id: string) => {
    setCuts(cuts.filter(cut => cut.id !== id));
  };

  const handleOptimize = () => {
    if (cuts.length === 0) {
      alert('Por favor agrega al menos un corte antes de optimizar');
      return;
    }

    const plateW = parseFloat(plateWidth);
    const plateH = parseFloat(plateHeight);

    if (isNaN(plateW) || plateW <= 0) {
      alert('El ancho de la placa debe ser un número positivo');
      return;
    }

    if (isNaN(plateH) || plateH <= 0) {
      alert('El alto de la placa debe ser un número positivo');
      return;
    }

    const enhanced = enhancedOptimizeGlassCutting(cuts, plateW, plateH, {
      context: optimizationContext,
      maxAlternatives: 8,
      enableRefinement: true,
      enableValidation: true
    });

    setEnhancedResult(enhanced);
    setOptimizationResult(enhanced.primary);
    setAlternativeResults(enhanced.alternatives);
    setCurrentPlateView(0);
    setShowAlternatives(false);
    setShowInsights(true);
  };

  const handleSave = () => {
    if (!optimizationResult) {
      alert('Por favor calcula la optimización antes de guardar');
      return;
    }
    setShowSaveModal(true);
  };

  const handleLoadProject = (project: GlassProject) => {
    setPlateWidth(project.plateWidth.toString());
    setPlateHeight(project.plateHeight.toString());
    setCuts(project.cutsRequested);
    setOptimizationResult(project.optimizationResult || null);
    setProjectName(project.projectName);
    setPlateOrientation(project.plateOrientation || 'TOP_LEFT');
    setCurrentPlateView(0);
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
      setCuts([]);
      setOptimizationResult(null);
      setAlternativeResults([]);
      setCutWidth('');
      setCutHeight('');
      setCutQuantity('1');
      setProjectName('Proyecto sin nombre');
      setCurrentPlateView(0);
      setShowAlternatives(false);
      setPlateOrientation('TOP_LEFT');
    }
  };

  const handleSwitchToAlternative = (index: number) => {
    if (alternativeResults[index] && optimizationResult) {
      const newAlternatives = [...alternativeResults];
      newAlternatives[index] = optimizationResult;
      setOptimizationResult(alternativeResults[index]);
      setAlternativeResults(newAlternatives);
      setCurrentPlateView(0);
    }
  };

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
        <h1 className="text-white text-4xl font-bold">OPTIMIZADOR DE VIDRIO</h1>
        <p className="text-gray-300 mt-2">Minimiza desperdicios y optimiza tus cortes</p>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#003366]">Configuración</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLoadModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FolderOpen size={18} />
                Cargar
              </button>
              {optimizationResult && (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={18} />
                    Guardar
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FileText size={18} />
                    Exportar
                  </button>
                </>
              )}
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Limpiar Todo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Dimensiones de Placa Base</h3>
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
              <h3 className="font-semibold text-gray-700 mb-3">Agregar Corte</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cutWidth}
                    onChange={(e) => setCutWidth(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] appearance-none"
                    placeholder="130"
                    style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cutHeight}
                    onChange={(e) => setCutHeight(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] appearance-none"
                    placeholder="45"
                    style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={cutQuantity}
                    onChange={(e) => setCutQuantity(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] appearance-none"
                    placeholder="1"
                    style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  />
                </div>
                <button
                  onClick={handleAddCut}
                  className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={18} />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {cuts.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">
                Cortes Solicitados ({cuts.reduce((sum, cut) => sum + (cut.quantity || 1), 0)} piezas, {cuts.length} tipos)
              </h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Ancho (cm)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Alto (cm)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Cantidad</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Área (m²)</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuts.map((cut, idx) => (
                      <tr key={cut.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{cut.width}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{cut.height}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 font-semibold">{cut.quantity || 1}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {(((cut.width * cut.height) / 10000) * (cut.quantity || 1)).toFixed(3)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleRemoveCut(cut.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contexto de Optimización
              </label>
              <select
                value={optimizationContext}
                onChange={(e) => setOptimizationContext(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
              >
                <option value="BALANCED">Balanceado (Recomendado)</option>
                <option value="PRODUCTION">Producción (Menos placas, más rápido)</option>
                <option value="EXPENSIVE_MATERIAL">Material Costoso (Máximo aprovechamiento)</option>
                <option value="QUICK_CUT">Corte Rápido (Menos cortes)</option>
              </select>
            </div>

            <button
              onClick={handleOptimize}
              disabled={cuts.length === 0}
              className="w-full px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors flex items-center justify-center gap-2 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator size={24} />
              Calcular Optimización Inteligente
            </button>
          </div>
        </div>

        {optimizationResult && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#003366]">
                    {optimizationResult.strategy?.name || 'Optimización Recomendada'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {optimizationResult.strategy?.description || 'Estrategia optimizada seleccionada'}
                  </p>
                </div>
                {alternativeResults.length > 0 && (
                  <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Repeat size={18} />
                    {showAlternatives ? 'Ocultar Alternativas' : `Ver ${alternativeResults.length} Alternativa${alternativeResults.length > 1 ? 's' : ''}`}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {optimizationResult.totalPlates}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Placas Necesarias</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {optimizationResult.averageUtilization.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Aprovechamiento</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {optimizationResult.totalGuillotineCuts || optimizationResult.instructions.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Cortes Guillotina</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {(optimizationResult.totalWaste / 10000).toFixed(2)} m²
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Desperdicio Total</div>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-teal-600">
                    {optimizationResult.wasteQuality?.reusableWastePieces || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Sobrantes Útiles</div>
                </div>
              </div>

              {optimizationResult.wasteQuality?.largestWastePiece && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Mayor sobrante reutilizable: </span>
                    {optimizationResult.wasteQuality.largestWastePiece.width.toFixed(1)} × {optimizationResult.wasteQuality.largestWastePiece.height.toFixed(1)} cm
                    ({(optimizationResult.wasteQuality.largestWastePiece.area / 10000).toFixed(3)} m²)
                  </p>
                </div>
              )}

              {enhancedResult && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <Info size={18} className="text-blue-600" />
                      Análisis Inteligente
                    </h3>
                    <button
                      onClick={() => setShowInsights(!showInsights)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showInsights ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>

                  {showInsights && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-xs text-blue-600 font-semibold mb-1">Tipo de Proyecto</div>
                          <div className="text-sm text-blue-900">{
                            enhancedResult.profile.type === 'UNIFORM' ? '🔷 Piezas Uniformes' :
                            enhancedResult.profile.type === 'MIXED' ? '🔶 Piezas Mixtas' :
                            enhancedResult.profile.type === 'LARGE_DOMINANT' ? '⬛ Piezas Grandes' :
                            enhancedResult.profile.type === 'MANY_SMALL' ? '🔹 Muchas Pequeñas' :
                            '⬜ Pocas Grandes'
                          }</div>
                        </div>

                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-xs text-green-600 font-semibold mb-1">Nivel de Confianza</div>
                          <div className="text-sm text-green-900 flex items-center gap-2">
                            {enhancedResult.metadata.confidenceLevel === 'HIGH' && <CheckCircle size={16} className="text-green-600" />}
                            {enhancedResult.metadata.confidenceLevel === 'MEDIUM' && <AlertTriangle size={16} className="text-yellow-600" />}
                            {enhancedResult.metadata.confidenceLevel === 'LOW' && <AlertTriangle size={16} className="text-red-600" />}
                            {enhancedResult.metadata.confidenceLevel === 'HIGH' ? 'ALTA' :
                             enhancedResult.metadata.confidenceLevel === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
                            ({enhancedResult.primaryScore.confidence.toFixed(0)}%)
                          </div>
                        </div>

                        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                          <div className="text-xs text-violet-600 font-semibold mb-1">Puntuación Total</div>
                          <div className="text-sm text-violet-900 font-bold">{enhancedResult.primaryScore.totalScore.toFixed(1)}/100</div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <Lightbulb size={18} className="text-yellow-600 mt-0.5" />
                          <h4 className="font-semibold text-gray-800">Insights</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {getOptimizationInsights(enhancedResult).map((insight, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {enhancedResult.validation && !enhancedResult.validation.isValid && (
                        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertTriangle size={18} className="text-red-600 mt-0.5" />
                            <h4 className="font-semibold text-red-800">Errores de Validación</h4>
                          </div>
                          <ul className="space-y-1">
                            {enhancedResult.validation.errors.slice(0, 5).map((error, idx) => (
                              <li key={idx} className="text-sm text-red-700">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancedResult.validation && enhancedResult.validation.warnings.length > 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <Info size={18} className="text-yellow-600 mt-0.5" />
                            <h4 className="font-semibold text-yellow-800">Advertencias</h4>
                          </div>
                          <ul className="space-y-1">
                            {enhancedResult.validation.warnings.slice(0, 3).map((warning, idx) => (
                              <li key={idx} className="text-sm text-yellow-700">{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancedResult.suggestions && enhancedResult.suggestions.length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <Lightbulb size={18} className="text-blue-600 mt-0.5" />
                            <h4 className="font-semibold text-blue-800">Sugerencias de Mejora</h4>
                          </div>
                          <ul className="space-y-1.5">
                            {enhancedResult.suggestions.slice(0, 5).map((suggestion, idx) => (
                              <li key={idx} className="text-sm text-blue-700">
                                <span className="font-medium">[{suggestion.type}]</span> {suggestion.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {showAlternatives && alternativeResults.length > 0 && enhancedResult && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-[#003366] mb-4">
                  Estrategias Alternativas (Ordenadas por Calidad)
                </h3>
                <div className="space-y-4">
                  {alternativeResults.map((alt, index) => {
                    const altScore = enhancedResult.alternativeScores[index];
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800">{alt.strategy?.name || `Alternativa ${index + 1}`}</h4>
                              {altScore && (
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  altScore.totalScore >= 80 ? 'bg-green-100 text-green-700' :
                                  altScore.totalScore >= 65 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  Puntuación: {altScore.totalScore.toFixed(0)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{alt.strategy?.description}</p>
                          </div>
                          <button
                            onClick={() => handleSwitchToAlternative(index)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap ml-3"
                          >
                            Usar Esta
                          </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{alt.totalPlates}</div>
                            <div className="text-gray-500 text-xs">Placas</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600">{alt.averageUtilization.toFixed(1)}%</div>
                            <div className="text-gray-500 text-xs">Aprovech.</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-orange-600">{alt.totalGuillotineCuts || alt.instructions.length}</div>
                            <div className="text-gray-500 text-xs">Cortes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-red-600">{(alt.totalWaste / 10000).toFixed(2)}</div>
                            <div className="text-gray-500 text-xs">Desp. m²</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-teal-600">{alt.wasteQuality?.reusableWastePieces || 0}</div>
                            <div className="text-gray-500 text-xs">Sobrantes</div>
                          </div>
                          {altScore && (
                            <div className="text-center">
                              <div className="font-bold text-violet-600">{altScore.compactnessScore.toFixed(0)}</div>
                              <div className="text-gray-500 text-xs">Compacto</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {optimizationResult.plates.length > 0 && (
              <>
                <div className="mb-6">
                  <PlateOrientationSelector
                    selectedOrientation={plateOrientation}
                    onOrientationChange={setPlateOrientation}
                  />
                </div>

                <div className="mb-6">
                  <GlassVisualization
                    plate={optimizationResult.plates[currentPlateView]}
                    plateWidth={parseFloat(plateWidth)}
                    plateHeight={parseFloat(plateHeight)}
                    orientation={plateOrientation}
                  />
                </div>

                {optimizationResult.plates.length > 1 && (
                  <div className="flex justify-center items-center gap-4 mb-6">
                    <button
                      onClick={() => setCurrentPlateView(Math.max(0, currentPlateView - 1))}
                      disabled={currentPlateView === 0}
                      className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft size={18} />
                      Anterior
                    </button>
                    <span className="text-white font-semibold">
                      Placa {currentPlateView + 1} de {optimizationResult.plates.length}
                    </span>
                    <button
                      onClick={() => setCurrentPlateView(Math.min(optimizationResult.plates.length - 1, currentPlateView + 1))}
                      disabled={currentPlateView === optimizationResult.plates.length - 1}
                      className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Siguiente
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                <div className="mb-6">
                  <CuttingInstructions
                    instructions={optimizationResult.instructions}
                    plateNumber={currentPlateView + 1}
                    plateWidth={parseFloat(plateWidth)}
                    plateHeight={parseFloat(plateHeight)}
                    orientation={plateOrientation}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <SaveGlassProjectModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        projectData={{
          plateWidth: parseFloat(plateWidth),
          plateHeight: parseFloat(plateHeight),
          cutsRequested: cuts,
          optimizationResult: optimizationResult || undefined,
          plateOrientation: plateOrientation
        }}
        onSaveSuccess={(project) => {
          setProjectName(project.projectName);
          alert('Proyecto guardado exitosamente');
        }}
      />

      <SavedGlassProjectsModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoadProject={handleLoadProject}
      />

      {optimizationResult && (
        <ExportGlassReportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          projectName={projectName}
          plateWidth={parseFloat(plateWidth)}
          plateHeight={parseFloat(plateHeight)}
          optimizationResult={optimizationResult}
          orientation={plateOrientation}
        />
      )}
    </div>
  );
}
