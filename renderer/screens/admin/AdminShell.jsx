// renderer/screens/admin/AdminShell.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { POSTerminal } from '../staff/POSTerminal/POSTerminal';
import { MenuManagement } from './Menu/MenuManagement';
import { DashboardScreen } from './Dashboard/DashboardScreen';
import { StaffManagement } from './Staff/StaffManagement';
import { StoreSettings } from './Settings/StoreSettings';
import { InventoryLedger } from '../admin-staff/Inventory/InventoryLedger';
import { ReportsScreen } from '../admin-staff/Reports/ReportsScreen';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import logoImg from '../../assets/logo.png';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Settings,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Lock,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const OVERVIEW_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS Terminal', icon: ShoppingCart },
  { id: 'inventory', label: 'Daily Inventory', icon: ClipboardList },
  { id: 'reports', label: 'Shift & Sales Reports', icon: BarChart3 },
  { id: 'menu', label: 'Menu & Recipes', icon: UtensilsCrossed },
];

const ACCOUNT_ITEMS = [
  { id: 'staff', label: 'Staff Accounts', icon: Users },
  { id: 'settings', label: 'Store Settings', icon: Settings },
];

export function AdminShell() {
  const { user, logout, lockScreen } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('takotime_admin_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('takotime_admin_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    // Ensure standard crisp commercial theme is active
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('takotime_theme');
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Modern Collapsible Sidebar */}
      <aside
        className={`modern-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          width: isCollapsed ? '76px' : '260px',
          padding: isCollapsed ? '12px 6px' : '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header - Fixed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0 0 8px 0' : '0 6px 14px 6px',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
          marginBottom: isCollapsed ? '4px' : '6px',
          flexShrink: 0,
        }}>
          {/* Logo Badge */}
          <div
            className="sidebar-logo-badge"
            style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
            onClick={() => { if (isCollapsed) setIsCollapsed(false); }}
            data-tooltip={isCollapsed ? 'Expand sidebar' : undefined}
            title={isCollapsed ? 'Click to expand sidebar' : 'TAKOTIME'}
          >
            <img src={logoImg} alt="TAKOTIME" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>

          {/* Brand Title & Collapse Button */}
          {!isCollapsed && (
            <>
              <div className="sidebar-header-text" style={{ flex: 1, minWidth: 0, paddingLeft: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.15 }}>TAKOTIME</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Admin Portal</div>
              </div>

              <button
                type="button"
                className="sidebar-toggle-btn sidebar-header-collapse-btn"
                onClick={() => setIsCollapsed(true)}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div
          className="sidebar-nav-container"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: isCollapsed ? 'hidden' : 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            paddingRight: isCollapsed ? '0' : '2px',
          }}
        >
          {/* Section: OVERVIEW */}
          <div className="modern-nav-section-title">OVERVIEW</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed ? '4px' : '8px' }}>
            {OVERVIEW_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`modern-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  data-tooltip={item.label}
                  title={isCollapsed ? item.label : undefined}
                >
                  <ChevronRight size={13} className="nav-chevron" />
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Separator line between OVERVIEW and ACCOUNT */}
          <div className="sidebar-divider" />

          {/* Section: ACCOUNT */}
          <div className="modern-nav-section-title" style={{ marginTop: isCollapsed ? '0' : '6px' }}>
            ACCOUNT
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed ? '4px' : '8px' }}>
            {ACCOUNT_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`modern-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  data-tooltip={item.label}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}

            {/* Lock Screen */}
            <button
              type="button"
              className="modern-nav-item"
              onClick={lockScreen}
              data-tooltip="Lock Screen"
              title={isCollapsed ? 'Lock Screen' : undefined}
            >
              <Lock size={18} className="nav-icon" />
              <span className="nav-label">Lock Screen</span>
            </button>

            {/* Log Out */}
            <button
              type="button"
              className="modern-nav-item"
              onClick={logout}
              data-tooltip="Log out"
              title={isCollapsed ? 'Log out' : undefined}
              style={{ color: 'var(--brand-danger)' }}
            >
              <LogOut size={18} className="nav-icon" style={{ color: 'var(--brand-danger)' }} />
              <span className="nav-label" style={{ color: 'var(--brand-danger)' }}>Log out</span>
            </button>
          </nav>
        </div>

        {/* Footer Area - Fixed (User profile & Role badge) */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: isCollapsed ? '8px' : '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isCollapsed ? '4px' : '6px',
          flexShrink: 0,
        }}>
          {!isCollapsed ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '2px 4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-red)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                }}>
                  {user?.name || 'Store Admin'}
                </div>
              </div>

              {/* Role Badge replacing Online status */}
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--brand-red-light)',
                  color: 'var(--brand-red)',
                  border: '1px solid var(--brand-red-border)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {user?.role === 'admin' ? 'Admin' : (user?.role || 'Admin')}
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="sidebar-footer-expand-btn"
              onClick={() => setIsCollapsed(false)}
              data-tooltip="Expand sidebar"
              title="Expand sidebar"
              style={{ width: '42px', height: '36px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Content Area */}
      <main style={{
        flex: 1,
        backgroundColor: 'var(--bg-app)',
        overflowY: ['pos', 'menu', 'inventory', 'reports'].includes(activeTab) ? 'hidden' : 'auto',
        overflowX: 'hidden',
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

