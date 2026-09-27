// renderer/screens/admin-staff/AdminStaffShell.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { POSTerminal } from '../staff/POSTerminal/POSTerminal';
import logoImg from '../../assets/logo.png';
import { ClipboardList, BarChart3, ShoppingCart, Lock, LogOut } from 'lucide-react';

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

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
            <button
              className={`btn ${activeTab === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('pos')}
            >
              <ShoppingCart size={16} />
              POS Terminal
            </button>
            <button
              className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('inventory')}
            >
              <ClipboardList size={16} />
              Daily Inventory
            </button>
            <button
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart3 size={16} />
              Shift & Sales Reports
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
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'pos' && <POSTerminal embedded={true} />}

        {activeTab === 'inventory' && (
          <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>Daily Inventory Ledger</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
                Track daily opening balances, stock in, recipe-computed suggested out, confirmed out, and shrinkage.
              </p>

              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <ClipboardList size={48} color="var(--brand-gold)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '8px', fontWeight: 800 }}>Inventory Engine Initialized</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Phase 3 will connect the interactive ledger to SQLite <code>inventory_logs</code> and recipes.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>Shift & Sales Reports</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
                Summary of daily orders, cash accountability (expected vs actual), and CSV export.
              </p>

              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <BarChart3 size={48} color="var(--brand-green)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '8px', fontWeight: 800 }}>Reporting Engine Ready</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Phase 3 will wire up the live aggregation metrics and CSV export generator.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
