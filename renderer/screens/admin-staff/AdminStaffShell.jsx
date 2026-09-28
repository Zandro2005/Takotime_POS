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
      <header className="admin-staff-navbar">
        <div className="admin-staff-topbar">
          <div className="admin-staff-brand">
            <img src={logoImg} alt="TAKOTIME" className="admin-staff-logo" />
            <div>
              <span className="admin-staff-title">TAKOTIME</span>
              <span className="admin-hub-subtitle">Store Hub</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (inline with brand) */}
          <nav className="admin-nav-group-horizontal desktop-only-nav">
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

          {/* User Controls */}
          <div className="admin-staff-user-actions">
            <div className="admin-staff-profile">
              <span className="badge badge-admin-staff">Lead Staff</span>
              <span className="admin-staff-name">{user?.name}</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary pos-icon-btn"
              onClick={lockScreen}
              title="Lock Terminal"
            >
              <Lock size={15} />
              <span className="btn-label-text">Lock</span>
            </button>

            <button
              type="button"
              className="btn btn-danger pos-icon-btn"
              onClick={logout}
              title="Log Out"
            >
              <LogOut size={15} />
              <span className="btn-label-text">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (visible on <= 768px so nothing is cut off) */}
        <div className="admin-staff-mobile-nav">
          <nav className="admin-nav-group-horizontal admin-nav-mobile-tabs">
            <button
              type="button"
              className={`admin-nav-item-horizontal ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <ShoppingCart size={15} />
              <span>POS</span>
            </button>
            <button
              type="button"
              className={`admin-nav-item-horizontal ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <ClipboardList size={15} />
              <span>Inventory</span>
            </button>
            <button
              type="button"
              className={`admin-nav-item-horizontal ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart3 size={15} />
              <span>Reports</span>
            </button>
          </nav>
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
