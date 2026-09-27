// renderer/screens/staff/POSTerminal/PaymentModal.jsx
import React, { useState } from 'react';
import { X, Banknote, QrCode, ArrowRight } from 'lucide-react';
import { PAYMENT_METHODS } from '@shared/constants.js';

export function PaymentModal({ totalDue, onComplete, onClose }) {
  const [method, setMethod] = useState(PAYMENT_METHODS.CASH);
  const [amountTendered, setAmountTendered] = useState(totalDue.toString());
  const [gcashRefNo, setGcashRefNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickBills = [
    { label: 'Exact', value: totalDue },
    { label: '₱50', value: 50 },
    { label: '₱100', value: 100 },
    { label: '₱200', value: 200 },
    { label: '₱500', value: 500 },
    { label: '₱1,000', value: 1000 },
  ].filter(b => b.value >= totalDue || b.label === 'Exact');

  const parsedTendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, parsedTendered - totalDue);
  const isUnderpaid = method === PAYMENT_METHODS.CASH && parsedTendered < totalDue;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (method === PAYMENT_METHODS.CASH) {
      if (isUnderpaid) {
        setError(`Amount tendered is ₱${(totalDue - parsedTendered).toFixed(2)} short`);
        return;
      }
    } else if (method === PAYMENT_METHODS.GCASH) {
      if (!gcashRefNo.trim()) {
        setError('Please enter the GCash reference number');
        return;
      }
    }

    setLoading(true);
    try {
      await onComplete({
        paymentMethod: method,
        amountTendered: method === PAYMENT_METHODS.CASH ? parsedTendered : totalDue,
        changeDue: method === PAYMENT_METHODS.CASH ? changeDue : 0,
        gcashRefNo: method === PAYMENT_METHODS.GCASH ? gcashRefNo.trim() : null,
      });
    } catch (err) {
      setError(err.message || 'Payment processing error');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9993,
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
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>Collect Payment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select tender method and confirm</p>
          </div>
          <button type="button" className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Total Banner */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL DUE:</span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>
            ₱{totalDue.toFixed(2)}
          </span>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Method Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '14px',
              fontSize: '1rem',
              backgroundColor: method === PAYMENT_METHODS.CASH ? 'var(--brand-red)' : 'var(--bg-surface-elevated)',
              color: method === PAYMENT_METHODS.CASH ? '#ffffff' : 'var(--text-main)',
              borderColor: method === PAYMENT_METHODS.CASH ? 'var(--brand-red)' : 'var(--border-subtle)',
              fontWeight: 700,
            }}
            onClick={() => setMethod(PAYMENT_METHODS.CASH)}
          >
            <Banknote size={20} />
            Cash Tender
          </button>

          <button
            type="button"
            className="btn"
            style={{
              padding: '14px',
              fontSize: '1rem',
              backgroundColor: method === PAYMENT_METHODS.GCASH ? 'var(--brand-red)' : 'var(--bg-surface-elevated)',
              color: method === PAYMENT_METHODS.GCASH ? '#ffffff' : 'var(--text-main)',
              borderColor: method === PAYMENT_METHODS.GCASH ? 'var(--brand-red)' : 'var(--border-subtle)',
              fontWeight: 700,
            }}
            onClick={() => setMethod(PAYMENT_METHODS.GCASH)}
          >
            <QrCode size={20} />
            GCash QR
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {method === PAYMENT_METHODS.CASH ? (
            <>
              {/* Quick Cash Bills */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Quick Cash Denomination
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {quickBills.map((b, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        borderColor: parsedTendered === b.value ? 'var(--brand-red)' : undefined,
                        backgroundColor: parsedTendered === b.value ? 'var(--brand-red-light)' : undefined,
                        color: parsedTendered === b.value ? 'var(--brand-red)' : undefined,
                      }}
                      onClick={() => setAmountTendered(b.value.toString())}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Tendered Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Amount Tendered (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input-field"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    height: '56px',
                  }}
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Change Due Display */}
              <div style={{
                background: isUnderpaid ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${isUnderpaid ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isUnderpaid ? '#b91c1c' : '#166534' }}>
                  {isUnderpaid ? 'Underpaid Shortage:' : 'Change Due:'}
                </span>
                <span style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: isUnderpaid ? '#dc2626' : '#16a34a',
                }}>
                  ₱{(isUnderpaid ? totalDue - parsedTendered : changeDue).toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            /* GCash Ref Input */
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                GCash Reference Number
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 100984283921"
                value={gcashRefNo}
                onChange={(e) => setGcashRefNo(e.target.value)}
                style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', height: '52px' }}
                autoFocus
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Verify the payment on customer's GCash receipt screen before completing.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 700 }}
            disabled={loading || isUnderpaid}
          >
            {loading ? 'Processing Sale...' : 'Complete Sale'}
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
