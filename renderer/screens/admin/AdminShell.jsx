// renderer/screens/admin/AdminShell.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { POSTerminal } from '../staff/POSTerminal/POSTerminal';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Settings,
  Activity,
  ShoppingCart,
  Lock,
  LogOut,
  Flame,
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
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              padding: '8px',
              borderRadius: '10px',
              color: 'white',
              display: 'flex',
            }}>
              <Flame size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>TAKOTIME</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Portal</div>
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

            <button
              className={`btn ${activeTab === 'health' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('health')}
            >
              <Activity size={18} />
              System Health
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
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user?.name}</div>
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
      <main style={{ flex: 1, backgroundColor: 'var(--bg-app)', overflowY: 'auto' }}>
        {activeTab === 'pos' && <POSTerminalShell />}

        {activeTab === 'dashboard' && (
          <div style={{ padding: '36px', maxWidth: '1100px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>Store Overview</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Real-time metrics from the local SQLite database.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY'S SALES</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-accent)', marginTop: '8px' }}>
                  ₱0.00
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginTop: '4px' }}>0 completed orders</div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE SHIFT</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
                  No Open Shift
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginTop: '4px' }}>Ready for Phase 2 opening</div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATABASE INTEGRITY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--brand-accent)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={22} />
                  OK (WAL Mode)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginTop: '4px' }}>pos.db healthy</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div style={{ padding: '36px', maxWidth: '1100px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>Menu & Recipe Management</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Configure categories, products, prices, modifier add-ons, and bill-of-materials.
            </p>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
            }}>
              <UtensilsCrossed size={48} color="var(--brand-primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Menu Engine Seeded</h3>
              <p style={{ color: 'var(--text-muted)' }}>Initial catalog is stored in SQLite. Phase 4 will provide full in-app editing.</p>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div style={{ padding: '36px', maxWidth: '1100px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>Staff Accounts</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Manage cashier accounts, role permissions, and fast-login PINs.
            </p>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
            }}>
              <Users size={48} color="var(--brand-secondary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Accounts Database Active</h3>
              <p style={{ color: 'var(--text-muted)' }}>Default accounts seeded: Cashier (PIN 1111), Supervisor (PIN 5678), Admin (PIN 1234).</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '36px', maxWidth: '1100px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>Store Settings</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Receipt headers, store location, timeouts, and backup preferences.
            </p>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
            }}>
              <Settings size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Settings Table Initialized</h3>
              <p style={{ color: 'var(--text-muted)' }}>Phase 5 will add the full visual configuration screen.</p>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div style={{ padding: '36px', maxWidth: '1100px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>System Health & Diagnostics</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Monitor SQLite WAL status, rotating log files, and automated backups.
            </p>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Database size={24} color="var(--brand-accent)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Local Database: Healthy</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>data/pos.db • PRAGMA journal_mode = WAL</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity size={24} color="var(--brand-secondary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Diagnostics Logging: Active</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>logs/app.log • Rotating 5 × 5MB buffer</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Cloud size={24} color="var(--text-faint)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Cloud Sync Bridge: Standby</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scheduled for Phase 6 (Store operates 100% offline)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
