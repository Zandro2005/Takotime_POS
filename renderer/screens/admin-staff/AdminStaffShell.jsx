// renderer/screens/admin-staff/AdminStaffShell.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { POSTerminal } from '../staff/POSTerminal/POSTerminal';
import { InventoryLedger } from './Inventory/InventoryLedger';
import { ReportsScreen } from './Reports/ReportsScreen';
import logoImg from '../../assets/logo.png';
import { ClipboardList, BarChart3, ShoppingCart, Lock, LogOut } from 'lucide-react';

import { ErrorBoundary } from '../../components/ErrorBoundary';

export function AdminStaffShell() {
  const { user, logout, lockScreen } = useAuth();
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'inventory', 'reports'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Header */}
      <header style={{
        height: '62px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoImg} alt="TAKOTIME" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <div>
              <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem', color: 'var(--text-main)' }}>TAKOTIME</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginLeft: '8px' }}>Store Hub</span>
            </div>
          </div>

          {/* Navigation Tabs - Single Unified Container */}
          <nav className="admin-nav-group-horizontal" style={{ marginLeft: '20px' }}>
            <button
              type="button"
              className={`admin-nav-item-horizontal ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <ShoppingCart size={16} />
              <span>POS Terminal</span>
            </button>
            <button
              type="button"
              className={`admin-nav-item-horizontal ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <ClipboardList size={16} />
              <span>Daily Inventory</span>
            </button>
            <button
              type="button"
              className={`admin-nav-item-horizontal ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart3 size={16} />
              <span>Shift & Sales Reports</span>
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-admin-staff">Lead Staff</span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{user?.name}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
            onClick={lockScreen}
          >
            <Lock size={16} />
            Lock
          </button>

          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '8px 12px' }}
            onClick={logout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'pos' && (
          <ErrorBoundary title="POS Terminal Error" message="Unable to load POS Terminal.">
            <POSTerminal embedded={true} />
          </ErrorBoundary>
        )}
        {activeTab === 'inventory' && (
          <ErrorBoundary title="Daily Inventory Ledger Error" message="Unable to load Daily Inventory Ledger.">
            <InventoryLedger />
          </ErrorBoundary>
        )}
        {activeTab === 'reports' && (
          <ErrorBoundary title="Reports Error" message="Unable to load Store Reports.">
            <ReportsScreen />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
