import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Calendar, Layers } from 'lucide-react';
import { loadGlassProjects, deleteGlassProject, GlassProject } from '../utils/glassProjectsDB';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface SavedGlassProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: GlassProject) => void;
}

export function SavedGlassProjectsModal({ isOpen, onClose, onLoadProject }: SavedGlassProjectsModalProps) {
  const [projects, setProjects] = useState<GlassProject[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; projectId: string; projectName: string }>({
    show: false,
    projectId: '',
    projectName: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = () => {
    const loadedProjects = loadGlassProjects();
    setProjects(loadedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleDelete = (projectId: string, projectName: string) => {
    setDeleteConfirm({ show: true, projectId, projectName });
  };

  const confirmDelete = () => {
    const result = deleteGlassProject(deleteConfirm.projectId);
    if (result.success) {
      loadProjects();
    }
    setDeleteConfirm({ show: false, projectId: '', projectName: '' });
  };

  const handleLoad = (project: GlassProject) => {
    onLoadProject(project);
    onClose();
  };

  const filteredProjects = projects.filter(p =>
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#003366] flex items-center gap-2">
              <FolderOpen size={24} />
              Proyectos Guardados
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar proyecto..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No se encontraron proyectos' : 'No hay proyectos guardados'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#003366] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-[#003366]">
                        {project.projectName}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoad(project)}
                          className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors text-sm"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => handleDelete(project.id, project.projectName)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Layers size={16} />
                        <span>{project.cutsRequested.length} cortes</span>
                      </div>

                      {project.optimizationResult && (
                        <>
                          <div className="text-gray-600">
                            <span className="font-semibold">Placas:</span> {project.optimizationResult.totalPlates}
                          </div>
                          <div className="text-green-600">
                            <span className="font-semibold">Aprovechamiento:</span>{' '}
                            {project.optimizationResult.averageUtilization.toFixed(1)}%
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="font-semibold">Placa:</span> {project.plateWidth} × {project.plateHeight} cm
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, projectId: '', projectName: '' })}
        onConfirm={confirmDelete}
        itemName={deleteConfirm.projectName}
        itemType="proyecto"
      />
    </>
  );
}
