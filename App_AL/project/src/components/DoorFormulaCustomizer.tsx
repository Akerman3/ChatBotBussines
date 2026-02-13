import React, { useState } from 'react';
import { X, Save, RotateCcw, Eye } from 'lucide-react';

interface Formula {
  batienteVerticalHeight: number;
  cercochapaHeight: number;
  zocloWidth: number;
  duelaWidth: number;
}

interface DoorFormulaCustomizerProps {
  onClose: () => void;
  onSave: (formula: Formula) => void;
}

const DEFAULT_FORMULA = {
  batienteVerticalHeight: 1.3,
  cercochapaHeight: 1.7,
  zocloWidth: 13.7,
  duelaWidth: 2,
};

export function DoorFormulaCustomizer({ onClose, onSave }: DoorFormulaCustomizerProps) {
  const [formula, setFormula] = useState<Formula>(() => {
    const savedFormula = localStorage.getItem('doorFormula');
    return savedFormula ? JSON.parse(savedFormula) : DEFAULT_FORMULA;
  });
  const [tempInputs, setTempInputs] = useState<Partial<Record<keyof Formula, string>>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('doorFormula', JSON.stringify(formula));
    onSave(formula);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setFormula(DEFAULT_FORMULA);
    setTempInputs({});
    localStorage.removeItem('doorFormula');
    onSave(DEFAULT_FORMULA);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const validateNumber = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  };

  const handleInputChange = (key: keyof Formula, value: string) => {
    setTempInputs(prev => ({ ...prev, [key]: value }));
    
    if (value === '') {
      setFormula(prev => ({ ...prev, [key]: 0 }));
    } else if (validateNumber(value)) {
      setFormula(prev => ({ ...prev, [key]: parseFloat(value) }));
    }
  };

  const getInputValue = (key: keyof Formula): string => {
    if (key in tempInputs) {
      return tempInputs[key] || '';
    }
    return formula[key].toString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#003366]">Personalizar Fórmula</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Batiente Vertical
                </label>
                <input
                  type="number"
                  value={getInputValue('batienteVerticalHeight')}
                  onChange={(e) => handleInputChange('batienteVerticalHeight', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Cerco Chapa
                </label>
                <input
                  type="number"
                  value={getInputValue('cercochapaHeight')}
                  onChange={(e) => handleInputChange('cercochapaHeight', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Zoclo
                </label>
                <input
                  type="number"
                  value={getInputValue('zocloWidth')}
                  onChange={(e) => handleInputChange('zocloWidth', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aumento Duela
                </label>
                <input
                  type="number"
                  value={getInputValue('duelaWidth')}
                  onChange={(e) => handleInputChange('duelaWidth', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
            </div>

            {showPreview && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Vista Previa de Fórmulas:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Batiente Vertical = Alto - {formula.batienteVerticalHeight}</p>
                  <p>Cerco Chapa = Alto - {formula.cercochapaHeight}</p>
                  <p>Zoclo = Ancho - {formula.zocloWidth}</p>
                  <p>Duela = Zoclo + {formula.duelaWidth}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
                >
                  <RotateCcw size={18} />
                  Restablecer
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
                >
                  <Eye size={18} />
                  {showPreview ? 'Ocultar' : 'Vista Previa'}
                </button>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm mt-2 sm:mt-0"
              >
                <Save size={18} />
                Guardar
              </button>
            </div>

            {saved && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-center">
                ¡Cambios guardados correctamente!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}