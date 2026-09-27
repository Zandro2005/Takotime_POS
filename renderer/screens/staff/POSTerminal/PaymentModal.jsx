// renderer/screens/staff/POSTerminal/PaymentModal.jsx
import React, { useState } from 'react';
import { X, Banknote, QrCode, ArrowRight, CheckCircle2 } from 'lucide-react';
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
      backgroundColor: 'rgba(9, 13, 22, 0.88)',
      backdropFilter: 'blur(10px)',
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
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Collect Payment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select tender method and confirm</p>
          </div>
          <button type="button" className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Total Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.15), rgba(245, 158, 11, 0.15))',
          border: '1px solid rgba(255, 87, 34, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL DUE:</span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
            ₱{totalDue.toFixed(2)}
          </span>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Method Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            className={`btn ${method === PAYMENT_METHODS.CASH ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '14px', fontSize: '1rem' }}
            onClick={() => setMethod(PAYMENT_METHODS.CASH)}
          >
            <Banknote size={20} />
            Cash
          </button>

          <button
            type="button"
            className={`btn ${method === PAYMENT_METHODS.GCASH ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '14px', fontSize: '1rem' }}
            onClick={() => setMethod(PAYMENT_METHODS.GCASH)}
          >
            <QrCode size={20} />
            GCash
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {method === PAYMENT_METHODS.CASH ? (
            <>
              {/* Quick Cash Bills */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Quick Cash Amount
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
                        borderColor: parsedTendered === b.value ? 'var(--brand-primary)' : undefined,
                        backgroundColor: parsedTendered === b.value ? 'rgba(255, 87, 34, 0.15)' : undefined,
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
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
                background: isUnderpaid ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${isUnderpaid ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: isUnderpaid ? '#fca5a5' : 'var(--text-muted)' }}>
                  {isUnderpaid ? 'Underpaid by:' : 'Change Due:'}
                </span>
                <span style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: isUnderpaid ? '#f87171' : 'var(--brand-accent)',
                }}>
                  ₱{(isUnderpaid ? totalDue - parsedTendered : changeDue).toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            /* GCash Ref Input */
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
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
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '6px' }}>
                Check customer's GCash receipt on their phone to verify transaction ref number.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
            disabled={loading || isUnderpaid}
          >
            {loading ? 'Processing Order...' : 'Complete Sale'}
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
