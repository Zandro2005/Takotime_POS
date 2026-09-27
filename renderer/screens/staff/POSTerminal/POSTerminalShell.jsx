// renderer/screens/staff/POSTerminal/POSTerminalShell.jsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Flame, Lock, LogOut, ShoppingCart, UtensilsCrossed, Clock, Receipt, User } from 'lucide-react';

export function POSTerminalShell() {
  const { user, logout, lockScreen } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Top Navigation Bar */}
      <header style={{
        height: '60px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--brand-primary)',
            padding: '6px',
            borderRadius: '8px',
            color: 'white',
            display: 'flex',
          }}>
            <Flame size={20} />
          </div>
          <div>
            <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem' }}>TAKOTIME</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>Montalban • POS Terminal</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface-elevated)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-accent)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Offline Mode (Local SQLite)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-staff">Staff</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
            onClick={lockScreen}
            title="Lock Terminal"
          >
            <Lock size={16} />
            Lock
          </button>

          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '8px 12px' }}
            onClick={logout}
            title="Log Out"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Terminal Body */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        overflow: 'hidden',
      }}>
        {/* Left Side: Catalog / Menu Grid */}
        <section style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Category Tabs Preview */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              🐙 Takoyaki
            </button>
            <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              🥟 Siomai
            </button>
            <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              🥤 Drinks
            </button>
          </div>

          {/* Sample Product Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Classic Octopus Takoyaki</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>4pcs, 8pcs, 12pcs variants</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                ₱45.00 - ₱125.00
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Crab & Cheese Takoyaki</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>4pcs, 8pcs, 12pcs variants</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                ₱50.00 - ₱140.00
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Pork Siomai</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>4pcs / 8pcs</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                ₱40.00 - ₱75.00
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Japanese Green Tea</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Iced 16oz cup</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                ₱35.00
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Order Cart & Checkout Panel */}
        <aside style={{
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <ShoppingCart size={18} color="var(--brand-primary)" />
              Current Order
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Queue #001
            </span>
          </div>

          <div style={{
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-faint)',
            gap: '8px',
          }}>
            <UtensilsCrossed size={36} strokeWidth={1.5} />
            <p style={{ fontSize: '0.9rem' }}>Cart is currently empty</p>
            <p style={{ fontSize: '0.8rem' }}>Phase 2 will activate full cart interactions!</p>
          </div>

          <div style={{
            padding: '20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₱0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Total Due</span>
              <span style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>₱0.00</span>
            </div>
            <button className="btn btn-primary" style={{ padding: '14px', width: '100%' }} disabled>
              Charge / Pay
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
