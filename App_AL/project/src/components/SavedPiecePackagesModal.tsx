import React, { useState, useEffect } from 'react';
import { X, Trash2, FolderOpen, Calendar, Package, Layers } from 'lucide-react';

interface SavedPiecePackage {
  id: string;
  name: string;
  date: string;
  pieces: any[];
  totalPieces: number;
  profileTypes: string[];
}

interface SavedPiecePackagesModalProps {
  onClose: () => void;
  onLoadPackage: (packageData: SavedPiecePackage) => void;
}

export function SavedPiecePackagesModal({ onClose, onLoadPackage }: SavedPiecePackagesModalProps) {
  const [savedPackages, setSavedPackages] = useState<SavedPiecePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SavedPiecePackage | null>(null);

  useEffect(() => {
    const packages = localStorage.getItem('savedPiecePackages');
    if (packages) {
      try {
        setSavedPackages(JSON.parse(packages));
      } catch (error) {
        console.error('Error loading saved piece packages:', error);
        setSavedPackages([]);
      }
    }
  }, []);

  const handleDeletePackage = (id: string) => {
    if (confirm('¿Estás seguro que deseas eliminar este paquete de piezas?')) {
      const updatedPackages = savedPackages.filter(pkg => pkg.id !== id);
      setSavedPackages(updatedPackages);
      localStorage.setItem('savedPiecePackages', JSON.stringify(updatedPackages));
      if (selectedPackage?.id === id) {
        setSelectedPackage(null);
      }
    }
  };

  const handleLoadPackage = (packageData: SavedPiecePackage) => {
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

  const getProfileTypeCounts = (pieces: any[]) => {
    const counts: { [key: string]: number } = {};
    pieces.forEach(piece => {
      counts[piece.type] = (counts[piece.type] || 0) + piece.pieces;
    });
    return counts;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-8 p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col sm:flex-row mx-2">
        {/* Lista de paquetes */}
        <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-gray-200 p-4 sm:p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003366]">Paquetes de Piezas Guardados</h2>
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
                <Layers size={64} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay paquetes de piezas guardados</p>
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
                        <span>{pkg.totalPieces} pieza{pkg.totalPieces !== 1 ? 's' : ''} total</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                        <Layers size={12} className="sm:size-[14px]" />
                        <span>{pkg.profileTypes.length} tipo{pkg.profileTypes.length !== 1 ? 's' : ''} de perfil</span>
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
                    <span>{selectedPackage.totalPieces} pieza{selectedPackage.totalPieces !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-bold text-[#003366] mb-3">Resumen por Tipo de Perfil</h4>
                <div className="space-y-3">
                  {selectedPackage.profileTypes.map((profileType) => {
                    const profilePieces = selectedPackage.pieces.filter(piece => piece.type === profileType);
                    const totalPiecesForType = profilePieces.reduce((sum, piece) => sum + piece.pieces, 0);
                    
                    return (
                      <div key={profileType} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-[#003366] text-sm sm:text-base">{profileType}</h5>
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">
                            {totalPiecesForType} pieza{totalPiecesForType !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {profilePieces.map((piece, index) => (
                            <div key={index} className="flex justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">{piece.windowType}</span>
                              <span className="font-medium">{piece.pieces} pz × {piece.measure} cm</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleLoadPackage(selectedPackage)}
                  className="w-full bg-[#003366] text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <FolderOpen size={16} className="sm:size-[20px]" />
                  Cargar Paquete de Piezas
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Layers size={48} className="mx-auto mb-4 text-gray-400 sm:size-[64px]" />
                <p className="text-sm sm:text-base">Selecciona un paquete para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}