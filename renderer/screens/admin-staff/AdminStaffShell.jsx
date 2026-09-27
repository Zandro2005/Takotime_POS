// renderer/screens/admin-staff/AdminStaffShell.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { POSTerminalShell } from '../staff/POSTerminal/POSTerminalShell';
import { ClipboardList, BarChart3, ShoppingCart, Lock, LogOut, Flame, AlertCircle } from 'lucide-react';

export function AdminStaffShell() {
  const { user, logout, lockScreen } = useAuth();
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'inventory', 'reports'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Top Header */}
      <header style={{
        height: '60px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              padding: '6px',
              borderRadius: '8px',
              color: 'white',
              display: 'flex',
            }}>
              <Flame size={20} />
            </div>
            <div>
              <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem' }}>TAKOTIME</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>Store Hub</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-admin-staff">Lead Staff</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</span>
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
        {activeTab === 'pos' && <POSTerminalShell />}

        {activeTab === 'inventory' && (
          <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Daily Inventory Ledger</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                Track daily ingredient opening stock, stock in, recipe-computed suggested out, confirmed out, and shrinkage.
              </p>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                <ClipboardList size={48} color="var(--brand-secondary)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Inventory Engine Ready</h3>
                <p>Phase 3 will connect the interactive ledger to SQLite <code>inventory_logs</code> and bill-of-materials.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Shift & Sales Reports</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                Summary of daily orders, cash accountability (expected vs actual), and CSV export.
              </p>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                <BarChart3 size={48} color="var(--brand-accent)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Reporting Engine Ready</h3>
                <p>Phase 3 will wire up the live aggregation metrics and CSV export generator.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
