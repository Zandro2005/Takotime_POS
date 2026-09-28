// renderer/screens/staff/POSTerminal/POSTerminalShell.jsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Flame, Lock, LogOut, ShoppingCart, UtensilsCrossed, Clock, Receipt, User, Utensils, CupSoda } from 'lucide-react';

export function POSTerminalShell() {
  const { user, logout, lockScreen } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Top Navigation Bar */}
      <header className="pos-top-navbar" style={{
        height: '60px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        gap: '12px',
        flexShrink: 0,
      }}>
        <div className="pos-brand-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div className="pos-brand-logo" style={{
            background: 'var(--brand-primary)',
            padding: '6px',
            borderRadius: '8px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Flame size={18} />
          </div>
          <div style={{ flexShrink: 0 }}>
            <span className="pos-brand-title" style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>TAKOTIME</span>
            <span className="pos-branch-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px', whiteSpace: 'nowrap' }}>Montalban • POS Terminal</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface-elevated)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Offline Mode (Local SQLite)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span className="badge badge-staff">Staff</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{user?.name}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '7px 11px', flexShrink: 0 }}
            onClick={lockScreen}
            title="Lock Terminal"
          >
            <Lock size={15} />
            <span className="btn-label-text">Lock</span>
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} /> Takoyaki
            </button>
            <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Utensils size={16} /> Siomai
            </button>
            <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <CupSoda size={16} /> Drinks
            </button>
          </div>

          {/* Sample Product Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '14px',
          }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '155px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Classic Octopus Takoyaki</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>4pcs, 8pcs, 12pcs variants</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', marginTop: '16px' }}>
                ₱45.00 - ₱125.00
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '155px',
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Crab & Cheese Takoyaki</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>4pcs, 8pcs, 12pcs variants</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', marginTop: '16px' }}>
                ₱50.00 - ₱140.00
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '155px',
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Pork Siomai</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>4pcs / 8pcs</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', marginTop: '16px' }}>
                ₱40.00 - ₱75.00
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '155px',
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Japanese Green Tea</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Iced 16oz cup</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', marginTop: '16px' }}>
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
            <p style={{ fontSize: '0.9rem' }}>Cart is empty</p>
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
