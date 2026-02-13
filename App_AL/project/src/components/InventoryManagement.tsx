import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { useInventoryDB } from '../hooks/useInventoryDB';
import { InventoryProfiles } from './inventory/InventoryProfiles';
import { InventoryGlass } from './inventory/InventoryGlass';
import { InventoryHardware } from './inventory/InventoryHardware';
import { InventorySuppliers } from './inventory/InventorySuppliers';
import { InventoryTransactions } from './inventory/InventoryTransactions';
import { InventoryReports } from './inventory/InventoryReports';
import { LowStockAlerts } from './inventory/LowStockAlerts';

interface InventoryManagementProps {
  onBack: () => void;
}

type Tab = 'profiles' | 'glass' | 'hardware' | 'suppliers' | 'transactions' | 'reports';

export function InventoryManagement({ onBack }: InventoryManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [showLowStockAlerts, setShowLowStockAlerts] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const inventoryDB = useInventoryDB();

  useEffect(() => {
    const updateLowStockCount = async () => {
      const profilesLowStock = await inventoryDB.profiles.getLowStock();
      const glassLowStock = await inventoryDB.glass.getLowStock();
      const hardwareLowStock = await inventoryDB.hardware.getLowStock();
      setLowStockCount(profilesLowStock.length + glassLowStock.length + hardwareLowStock.length);
    };
    updateLowStockCount();
  }, [activeTab]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profiles', label: 'Perfiles', icon: <Package size={20} /> },
    { id: 'glass', label: 'Vidrios', icon: <Package size={20} /> },
    { id: 'hardware', label: 'Herrajes', icon: <Package size={20} /> },
    { id: 'suppliers', label: 'Proveedores', icon: <Package size={20} /> },
    { id: 'transactions', label: 'Transacciones', icon: <TrendingUp size={20} /> },
    { id: 'reports', label: 'Reportes', icon: <TrendingUp size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-slate-600 hover:text-slate-900 transition-colors"
                aria-label="Volver al menú anterior"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Gestión de Inventario
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Control completo de materiales y suministros
                </p>
              </div>
            </div>

            {lowStockCount > 0 && (
              <button
                onClick={() => setShowLowStockAlerts(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <AlertTriangle size={20} />
                <span className="hidden sm:inline">Stock Bajo:</span>
                <span className="font-bold">{lowStockCount}</span>
              </button>
            )}
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profiles' && <InventoryProfiles />}
        {activeTab === 'glass' && <InventoryGlass />}
        {activeTab === 'hardware' && <InventoryHardware />}
        {activeTab === 'suppliers' && <InventorySuppliers />}
        {activeTab === 'transactions' && <InventoryTransactions />}
        {activeTab === 'reports' && <InventoryReports />}
      </div>

      {showLowStockAlerts && (
        <LowStockAlerts onClose={() => setShowLowStockAlerts(false)} />
      )}
    </div>
  );
}
