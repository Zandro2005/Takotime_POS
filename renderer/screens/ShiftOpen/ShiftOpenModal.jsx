// renderer/screens/ShiftOpen/ShiftOpenModal.jsx
import React, { useState } from 'react';
import { useShift } from '../../context/ShiftContext';
import { useAuth } from '../../context/AuthContext';
import { Coins, ArrowRight, LogOut, DollarSign } from 'lucide-react';

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
      backgroundColor: 'rgba(9, 13, 22, 0.95)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 87, 34, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ff5722, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 20px rgba(255, 87, 34, 0.4)',
          }}>
            <Coins size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Open Work Shift</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Cashier: <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong> • Montalban Stall
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Starting Cash Drawer Amount (₱)
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
                  height: '64px',
                }}
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                autoFocus
              />
            </div>

            {/* Quick Amount Pills */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
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
                    borderColor: startingCash === amt.toString() ? 'var(--brand-primary)' : undefined,
                  }}
                  onClick={() => setStartingCash(amt.toString())}
                >
                  ₱{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
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

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '14px' }}
              onClick={logout}
            >
              <LogOut size={16} />
              Sign Out
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, padding: '14px' }}
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
