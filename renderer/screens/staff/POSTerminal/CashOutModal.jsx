// renderer/screens/staff/POSTerminal/CashOutModal.jsx
import React, { useState } from 'react';
import { useShift } from '../../../context/ShiftContext';
import { CASH_MOVEMENT_TYPES } from '@shared/constants.js';
import { X, HandCoins, AlertCircle, CheckCircle2 } from 'lucide-react';

const COMMON_REASONS = [
  'Tube Ice',
  'Drinking Water',
  'Emergency Market Ingredients',
  'Cleaning Supplies',
  'Paper Cups & Bags',
  'Commissary Cash Payment',
];

const QUICK_AMOUNTS = [50, 100, 150, 200, 500];

export function CashOutModal({ onClose, onRecorded }) {
  const { currentShift, recordCashMovement } = useShift();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid cash amount greater than zero');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for taking cash out of the drawer');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await recordCashMovement(
        CASH_MOVEMENT_TYPES.CASH_OUT,
        numAmount,
        reason.trim()
      );
      setSuccessResult({ amount: numAmount, reason: reason.trim() });
      if (onRecorded) onRecorded(res);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || 'Failed to record cash out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 26px',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--brand-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <HandCoins size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
                Petty Cash Out
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '3px 0 0 0' }}>
                Shift #{currentShift?.id} • Cash Drawer Movement
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%', flexShrink: 0 }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: 'var(--radius-md)',
            color: '#dc2626',
            fontSize: '0.85rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successResult ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(5, 150, 105, 0.08)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            borderRadius: 'var(--radius-md)',
          }}>
            <CheckCircle2 size={40} color="var(--brand-green)" />
            <h3 style={{ margin: 0, color: 'var(--brand-green)', fontWeight: 800 }}>Cash Out Recorded</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <strong>₱{successResult.amount.toFixed(2)}</strong> deducted for: <em>"{successResult.reason}"</em>
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Updating drawer balance...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Amount Taken Out (₱)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  ₱
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  autoFocus
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 34px',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--brand-red)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Quick Amount Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: amount === String(amt) ? 'var(--brand-red)' : 'var(--bg-surface)',
                      color: amount === String(amt) ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Reason / Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Purchased 2 bags tube ice"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                }}
              />

              {/* Quick Preset Reason Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {COMMON_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    style={{
                      padding: '4px 9px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: reason === preset ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface)',
                      color: reason === preset ? 'var(--brand-red)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Note banner */}
            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}>
              💡 <em>This amount is immediately deducted from the cash drawer's expected balance for your shift close reconciliation.</em>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '11px', fontWeight: 600 }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  flex: 1.5,
                  padding: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--brand-red)',
                  borderColor: 'var(--brand-red)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                }}
                disabled={loading || !amount || !reason.trim()}
              >
                {loading ? 'Recording...' : `Confirm Cash Out${amount ? ` (₱${parseFloat(amount || 0).toFixed(2)})` : ''}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
