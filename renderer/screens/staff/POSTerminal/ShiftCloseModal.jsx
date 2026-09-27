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
      backgroundColor: 'rgba(9, 13, 22, 0.95)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Close Work Shift #{currentShift?.id}</h2>
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
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle size={40} color="var(--brand-accent)" />
              <h3 style={{ color: 'var(--brand-accent)' }}>Shift Successfully Closed</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Cash breakdown recorded in audit database.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                <span style={{ fontWeight: 700 }}>Expected Drawer Cash:</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
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
                color: closedResult.discrepancy === 0 ? 'var(--brand-accent)' : '#fca5a5',
                fontWeight: 800,
              }}>
                <span>Cash Discrepancy:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {closedResult.discrepancy >= 0 ? `+₱${closedResult.discrepancy.toFixed(2)}` : `-₱${Math.abs(closedResult.discrepancy).toFixed(2)}`}
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Counted Cash Drawer Balance (₱)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-primary)',
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
                    height: '60px',
                  }}
                  placeholder="0.00"
                  value={endingCash}
                  onChange={(e) => setEndingCash(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
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

            <div style={{ display: 'flex', gap: '12px' }}>
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
                className="btn btn-danger"
                style={{ flex: 2, padding: '12px' }}
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
