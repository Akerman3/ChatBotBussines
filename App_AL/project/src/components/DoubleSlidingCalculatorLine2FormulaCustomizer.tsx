import React, { useState } from 'react';
import { X, Save, RotateCcw, Eye } from 'lucide-react';

interface Formula {
  jambaVerticalHeight: number;
  ventilaCorrHeight: number;
  rielAdicionalWidth: number;
  zocloWidth: number;
}

interface DoubleSlidingCalculatorLine2FormulaCustomizerProps {
  onClose: () => void;
  onSave: (formula: Formula) => void;
}

export const DEFAULT_FORMULA = {
  jambaVerticalHeight: 2.8,
  ventilaCorrHeight: 4.0,
  rielAdicionalWidth: 2.7,
  zocloWidth: 16.2,
};

export function DoubleSlidingCalculatorLine2FormulaCustomizer({ 
  onClose, 
  onSave 
}: DoubleSlidingCalculatorLine2FormulaCustomizerProps) {
  const [formula, setFormula] = useState<Formula>(() => {
    const saved = localStorage.getItem('doubleSlidingLine2QuoteFormula');
    return saved ? JSON.parse(saved) : DEFAULT_FORMULA;
  });
  const [tempInputs, setTempInputs] = useState<Partial<Record<keyof Formula, string>>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('doubleSlidingLine2QuoteFormula', JSON.stringify(formula));
    onSave(formula);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setFormula(DEFAULT_FORMULA);
    setTempInputs({});
    localStorage.removeItem('doubleSlidingLine2QuoteFormula');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#003366]">
            Personalizar Fórmula
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Jamba Vertical
                </label>
                <input
                  type="number"
                  value={getInputValue('jambaVerticalHeight')}
                  onChange={(e) => handleInputChange('jambaVerticalHeight', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Ventila Corrediza
                </label>
                <input
                  type="number"
                  value={getInputValue('ventilaCorrHeight')}
                  onChange={(e) => handleInputChange('ventilaCorrHeight', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Riel Adicional
                </label>
                <input
                  type="number"
                  value={getInputValue('rielAdicionalWidth')}
                  onChange={(e) => handleInputChange('rielAdicionalWidth', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Zócalo
                </label>
                <input
                  type="number"
                  value={getInputValue('zocloWidth')}
                  onChange={(e) => handleInputChange('zocloWidth', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  step="0.1"
                />
              </div>
            </div>

            {showPreview && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Vista Previa de Fórmulas:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Jamba Vertical = Alto - {formula.jambaVerticalHeight}</p>
                  <p>Jamba Horizontal = Ancho</p>
                  <p>Riel = Ancho</p>
                  <p>Riel Adicional = Ancho - {formula.rielAdicionalWidth}</p>
                  <p>Cercochapa = Alto - {formula.ventilaCorrHeight}</p>
                  <p>Traslape = Alto - {formula.ventilaCorrHeight}</p>
                  <p>Zócalo = (Ancho - {formula.zocloWidth}) ÷ 2</p>
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