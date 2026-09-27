// renderer/screens/ShiftOpen/ShiftOpenModal.jsx
import React, { useState } from 'react';
import { useShift } from '../../context/ShiftContext';
import { useAuth } from '../../context/AuthContext';
import { Coins, ArrowRight, LogOut } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function ShiftOpenModal() {
  const { openShift } = useShift();
  const { user, logout } = useAuth();
  const [startingCash, setStartingCash] = useState('1000');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickAmounts = [500, 1000, 1500, 2000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cashVal = parseFloat(startingCash);
    if (isNaN(cashVal) || cashVal < 0) {
      setError('Please enter a valid starting cash amount');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await openShift(cashVal, notes);
    } catch (err) {
      setError(err.message || 'Failed to open shift');
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
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <img src={logoImg} alt="TAKOTIME" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Open Work Shift</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Cashier: <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong> • Montalban Branch
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Starting Cash Drawer Float (₱)
            </label>
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
                  height: '60px',
                }}
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                autoFocus
              />
            </div>

            {/* Quick Amount Pills */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    borderColor: startingCash === amt.toString() ? 'var(--brand-red)' : undefined,
                    backgroundColor: startingCash === amt.toString() ? 'var(--brand-red-light)' : undefined,
                    color: startingCash === amt.toString() ? 'var(--brand-red)' : undefined,
                  }}
                  onClick={() => setStartingCash(amt.toString())}
                >
                  ₱{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Opening Notes (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Morning float verified"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px' }}
              onClick={logout}
            >
              <LogOut size={16} />
              Sign Out
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Opening...' : 'Start Shift'}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
