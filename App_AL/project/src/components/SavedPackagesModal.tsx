import React, { useState, useEffect } from 'react';
import { X, Trash2, FolderOpen, Calendar, Package } from 'lucide-react';

interface SavedPackage {
  id: string;
  name: string;
  date: string;
  components: any[];
  totalComponents: number;
}

interface SavedPackagesModalProps {
  onClose: () => void;
  onLoadPackage: (packageData: SavedPackage) => void;
}

export function SavedPackagesModal({ onClose, onLoadPackage }: SavedPackagesModalProps) {
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SavedPackage | null>(null);

  useEffect(() => {
    const packages = localStorage.getItem('savedPackages');
    if (packages) {
      setSavedPackages(JSON.parse(packages));
    }
  }, []);

  const handleDeletePackage = (id: string) => {
    if (confirm('¿Estás seguro que deseas eliminar este paquete?')) {
      const updatedPackages = savedPackages.filter(pkg => pkg.id !== id);
      setSavedPackages(updatedPackages);
      localStorage.setItem('savedPackages', JSON.stringify(updatedPackages));
      if (selectedPackage?.id === id) {
        setSelectedPackage(null);
      }
    }
  };

  const handleLoadPackage = (packageData: SavedPackage) => {
    onLoadPackage(packageData);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col sm:flex-row mx-2">
        {/* Lista de paquetes */}
        <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-gray-200 p-4 sm:p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003366]">Paquetes Guardados</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} className="sm:size-[24px]" />
            </button>
          </div>

          <div className="space-y-4">
            {savedPackages.length === 0 ? (
              <div className="text-center py-8">
                <Package size={64} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay paquetes guardados</p>
              </div>
            ) : (
              savedPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedPackage?.id === pkg.id
                      ? 'border-[#003366] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <div className="flex justify-between items-start text-sm sm:text-base">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#003366] text-base sm:text-lg">{pkg.name}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                        <Calendar size={12} className="sm:size-[14px]" />
                        <span>{formatDate(pkg.date)}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                        <Package size={12} className="sm:size-[14px]" />
                        <span>{pkg.totalComponents} componente{pkg.totalComponents !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadPackage(pkg);
                        }}
                        className="p-1 sm:p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Cargar paquete"
                      >
                        <FolderOpen size={16} className="sm:size-[18px]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePackage(pkg.id);
                        }}
                        className="p-1 sm:p-2 text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar paquete"
                      >
                        <Trash2 size={16} className="sm:size-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalles del paquete seleccionado */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {selectedPackage ? (
            <div>
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#003366] mb-2">
                  {selectedPackage.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600 text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Calendar size={14} className="sm:size-[16px]" />
                    <span>{formatDate(selectedPackage.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Package size={14} className="sm:size-[16px]" />
                    <span>{selectedPackage.totalComponents} componente{selectedPackage.totalComponents !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-bold text-[#003366] mb-3">Componentes del Paquete</h4>
                <div className="space-y-3">
                  {selectedPackage.components.map((component, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#003366] rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="text-sm sm:text-base">
                          <p className="font-medium text-[#003366] text-sm sm:text-base">
                            {component.type === 'text' ? 'Texto' :
                             component.type === 'door' ? 'Puerta' :
                             component.type === 'fixed-sliding-window' ? 'Fijo Corredizo' :
                             component.type === 'double-sliding-window' ? 'Doble Corrediza' :
                             component.type === 'two-fixed-two-sliding-window' ? '2 Fijos 2 Corredizos' :
                             component.type === 'four-sliding-window' ? '4 Corredizas' :
                             'Componente'}
                          </p>
                          {component.content && (
                            <p className="text-xs sm:text-sm text-gray-600">"{component.content}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleLoadPackage(selectedPackage)}
                  className="w-full bg-[#003366] text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <FolderOpen size={16} className="sm:size-[20px]" />
                  Cargar Paquete
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Package size={48} className="mx-auto mb-4 text-gray-400 sm:size-[64px]" />
                <p className="text-sm sm:text-base">Selecciona un paquete para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}