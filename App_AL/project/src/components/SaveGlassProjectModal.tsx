import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { saveGlassProject, GlassProject } from '../utils/glassProjectsDB';

interface SaveGlassProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: Omit<GlassProject, 'id' | 'createdAt' | 'updatedAt' | 'projectName'>;
  onSaveSuccess?: (project: GlassProject) => void;
}

export function SaveGlassProjectModal({ isOpen, onClose, projectData, onSaveSuccess }: SaveGlassProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!projectName.trim()) {
      setError('Por favor ingresa un nombre para el proyecto');
      return;
    }

    setIsSaving(true);
    setError('');

    const result = saveGlassProject({
      ...projectData,
      projectName: projectName.trim()
    });

    setIsSaving(false);

    if (result.success && result.project) {
      if (onSaveSuccess) {
        onSaveSuccess(result.project);
      }
      setProjectName('');
      onClose();
    } else {
      setError(result.message);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#003366]">Guardar Proyecto</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Proyecto
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
              placeholder="Ej: Proyecto Ventanas Sala"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Resumen del Proyecto</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Placa: {projectData.plateWidth} × {projectData.plateHeight} cm</p>
              <p>• Cortes solicitados: {projectData.cutsRequested.length}</p>
              {projectData.optimizationResult && (
                <>
                  <p>• Placas necesarias: {projectData.optimizationResult.totalPlates}</p>
                  <p>• Aprovechamiento promedio: {projectData.optimizationResult.averageUtilization.toFixed(1)}%</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
