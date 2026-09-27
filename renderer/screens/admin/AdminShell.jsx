// renderer/screens/admin/AdminShell.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { POSTerminal } from '../staff/POSTerminal/POSTerminal';
import { MenuManagement } from './Menu/MenuManagement';
import { DashboardScreen } from './Dashboard/DashboardScreen';
import { StaffManagement } from './Staff/StaffManagement';
import { StoreSettings } from './Settings/StoreSettings';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import logoImg from '../../assets/logo.png';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Settings,
  ShoppingCart,
  Lock,
  LogOut,
  CheckCircle2,
  Database,
  Cloud
} from 'lucide-react';

export function AdminShell() {
  const { user, logout, lockScreen } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <img src={logoImg} alt="TAKOTIME" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: 1.1 }}>TAKOTIME</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Admin Portal</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <button
              className={`btn ${activeTab === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('pos')}
            >
              <ShoppingCart size={18} />
              POS Terminal
            </button>

            <button
              className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('menu')}
            >
              <UtensilsCrossed size={18} />
              Menu & Recipes
            </button>

            <button
              className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('staff')}
            >
              <Users size={18} />
              Staff Accounts
            </button>

            <button
              className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              Store Settings
            </button>
          </nav>
        </div>

        {/* User Card & Actions */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name}</div>
              <span className="badge badge-admin" style={{ marginTop: '4px' }}>Admin</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px', borderRadius: '50%' }}
              onClick={lockScreen}
              title="Lock Screen"
            >
              <Lock size={16} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-danger"
            style={{ width: '100%', padding: '10px' }}
            onClick={logout}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main style={{
        flex: 1,
        backgroundColor: 'var(--bg-app)',
        overflowY: activeTab === 'pos' || activeTab === 'menu' ? 'hidden' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}>
        {activeTab === 'pos' && (
          <ErrorBoundary title="POS Terminal Error" message="Unable to load POS Terminal.">
            <POSTerminal embedded={true} />
          </ErrorBoundary>
        )}
        {activeTab === 'dashboard' && (
          <ErrorBoundary title="Dashboard Error" message="Unable to load Dashboard.">
            <DashboardScreen onNavigate={setActiveTab} />
          </ErrorBoundary>
        )}
        {activeTab === 'menu' && (
          <ErrorBoundary title="Menu Management Error" message="Unable to load Menu Management.">
            <MenuManagement />
          </ErrorBoundary>
        )}
        {activeTab === 'staff' && (
          <ErrorBoundary title="Staff Management Error" message="Unable to load Staff Management.">
            <StaffManagement />
          </ErrorBoundary>
        )}
        {activeTab === 'settings' && (
          <ErrorBoundary title="Store Settings Error" message="Unable to load Store Settings.">
            <StoreSettings />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}
