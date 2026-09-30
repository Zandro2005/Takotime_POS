// renderer/screens/staff/POSTerminal/ShiftCloseModal.jsx
import React, { useState } from 'react';
import { useShift } from '../../../context/ShiftContext';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, X, AlertTriangle, CheckCircle } from 'lucide-react';

export function ShiftCloseModal({ onClose }) {
  const { currentShift, closeShift } = useShift();
  const { user, logout } = useAuth();
  const [endingCash, setEndingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [closedResult, setClosedResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cashVal = parseFloat(endingCash);
    if (isNaN(cashVal) || cashVal < 0) {
      setError('Please enter the counted cash amount in the drawer');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await closeShift(cashVal, notes);
      setClosedResult(res);
    } catch (err) {
      setError(err.message || 'Failed to close shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>Close Shift #{currentShift?.id}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Opened at: {new Date(currentShift?.opened_at).toLocaleTimeString()} • Starting: ₱{(currentShift?.starting_cash || 0).toFixed(2)}
            </p>
          </div>
          {!closedResult && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px', borderRadius: '50%' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {closedResult ? (
          /* Shift Closed Confirmation Card */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'rgba(5, 150, 105, 0.08)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle size={36} color="var(--brand-green)" />
              <h3 style={{ color: 'var(--brand-green)', fontWeight: 800 }}>Shift Successfully Closed</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Cash breakdown recorded in audit ledger.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.9rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Starting Float:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>₱{(closedResult.breakdown?.startingCash || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cash Sales:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>+₱{(closedResult.breakdown?.cashSales || 0).toFixed(2)}</span>
              </div>
              {closedResult.breakdown?.cashlessChangeGiven > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}>
                  <span>Cash Change for Cashless:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    -₱{closedResult.breakdown.cashlessChangeGiven.toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                <span style={{ fontWeight: 700 }}>Expected Drawer Cash:</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>
                  ₱{(closedResult.breakdown?.expectedCash || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Counted Ending Cash:</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  ₱{(closedResult.ending_cash || 0).toFixed(2)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: closedResult.discrepancy === 0 ? 'var(--brand-green)' : '#dc2626',
                fontWeight: 800,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '8px',
              }}>
                <span>Cash Discrepancy:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {closedResult.discrepancy >= 0 ? `+₱${closedResult.discrepancy.toFixed(2)}` : `-₱${Math.abs(closedResult.discrepancy).toFixed(2)}`}
                </span>
              </div>

              {/* Cashless Breakdown */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px dashed var(--border-subtle)',
                paddingTop: '10px',
                marginTop: '4px',
              }}>
                <span style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📱 Cashless / QR (GCash, Maya, Banks):
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>
                  ₱{(closedResult.breakdown?.cashlessSales ?? closedResult.breakdown?.gcashSales ?? 0).toFixed(2)}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '8px',
                marginTop: '2px',
                fontSize: '0.95rem',
              }}>
                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>Total Shift Revenue:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--text-main)' }}>
                  ₱{((closedResult.breakdown?.cashSales || 0) + (closedResult.breakdown?.cashlessSales ?? closedResult.breakdown?.gcashSales ?? 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px' }}
              onClick={logout}
            >
              <LogOut size={18} />
              Finish & Sign Out
            </button>
          </div>
        ) : (
          /* Ending Cash Input Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Counted Cash Drawer Balance (₱)
              </label>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Count physical bills & coins only. Cashless payments (GCash, Maya, MariBank, etc.) went to store accounts and do not belong in the cash drawer.
              </p>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-red)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  ₱
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="input-field"
                  style={{
                    paddingLeft: '38px',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    height: '58px',
                  }}
                  placeholder="0.00"
                  value={endingCash}
                  onChange={(e) => setEndingCash(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Closing Notes
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Cash count verified with manager"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', backgroundColor: 'var(--brand-red)', borderColor: 'var(--brand-red)', color: '#ffffff', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Reconciling...' : 'Confirm Shift Close'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
