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
  const isUnderpaid = parsedTendered < totalDue;
  const isCashless = method === PAYMENT_METHODS.CASHLESS || method === PAYMENT_METHODS.GCASH;

  const handleSelectMethod = (newMethod) => {
    setMethod(newMethod);
    setAmountTendered(totalDue.toString());
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isUnderpaid) {
      setError(`${isCashless ? 'Amount transferred' : 'Amount tendered'} is ₱${(totalDue - parsedTendered).toFixed(2)} short`);
      return;
    }

    setLoading(true);
    try {
      await onComplete({
        paymentMethod: method,
        amountTendered: parsedTendered,
        changeDue: changeDue,
        gcashRefNo: isCashless ? (gcashRefNo.trim() || null) : null,
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
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header - Clean without redundant subtitle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Collect Payment
          </h2>
          <button type="button" className="btn btn-secondary" style={{ padding: '7px', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Total Banner - Large & Prominent */}
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

        {error && <div className="error-banner" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{error}</div>}

        {/* Method Toggle - Large touch buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '14px 16px',
              fontSize: '1rem',
              backgroundColor: method === PAYMENT_METHODS.CASH ? 'var(--brand-red)' : 'var(--bg-surface-elevated)',
              color: method === PAYMENT_METHODS.CASH ? '#ffffff' : 'var(--text-main)',
              borderColor: method === PAYMENT_METHODS.CASH ? 'var(--brand-red)' : 'var(--border-subtle)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onClick={() => handleSelectMethod(PAYMENT_METHODS.CASH)}
          >
            <Banknote size={20} />
            Cash Tender
          </button>

          <button
            type="button"
            className="btn"
            style={{
              padding: '14px 16px',
              fontSize: '1rem',
              backgroundColor: isCashless ? 'var(--brand-red)' : 'var(--bg-surface-elevated)',
              color: isCashless ? '#ffffff' : 'var(--text-main)',
              borderColor: isCashless ? 'var(--brand-red)' : 'var(--border-subtle)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onClick={() => handleSelectMethod(PAYMENT_METHODS.CASHLESS)}
          >
            <QrCode size={20} />
            Cashless / QR
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Quick Denominations - Single Clean Row */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {quickBills.map((b, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '10px 5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  flex: 1,
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

          {/* Amount Input - Full Size, Big Font */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {isCashless ? 'Amount Transferred via QR (₱)' : 'Amount Tendered (₱)'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="input-field"
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                height: '56px',
              }}
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              autoFocus
            />
          </div>

          {/* Change Due Display - Same Height (56px) for Visual Symmetry */}
          <div style={{
            background: isUnderpaid ? '#fef2f2' : (changeDue > 0 ? '#f0fdf4' : '#f8fafc'),
            border: `1px solid ${isUnderpaid ? '#fecaca' : (changeDue > 0 ? '#bbf7d0' : '#e2e8f0')}`,
            borderRadius: 'var(--radius-md)',
            height: '56px',
            padding: '0 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: isUnderpaid ? '#b91c1c' : (changeDue > 0 ? '#166534' : 'var(--text-secondary)') }}>
                {isUnderpaid ? 'Underpaid Shortage:' : 'Change Due:'}
              </span>
              {changeDue > 0 && isCashless && (
                <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600, lineHeight: 1 }}>
                  Give cash change to customer
                </div>
              )}
            </div>
            <span style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: isUnderpaid ? '#dc2626' : (changeDue > 0 ? '#16a34a' : 'var(--text-muted)'),
            }}>
              ₱{(isUnderpaid ? totalDue - parsedTendered : changeDue).toFixed(2)}
            </span>
          </div>

          {/* Equal-Height Row for Both Methods to Guarantee Identical Modal Height */}
          <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
            {isCashless ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Ref # (Opt):
                </span>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 4821 or leave blank"
                  value={gcashRefNo}
                  onChange={(e) => setGcashRefNo(e.target.value)}
                  style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', height: '40px', padding: '4px 10px', flex: 1 }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Banknote size={17} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span>Count change and hand queue slip to customer upon completion</span>
              </div>
            )}
          </div>

          {/* Complete Button - Large & Clear */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '17px', fontSize: '1.08rem', fontWeight: 700, color: '#ffffff' }}
            disabled={loading || isUnderpaid}
          >
            {loading ? 'Processing Sale...' : (changeDue > 0 ? `Complete Sale (Give ₱${changeDue.toFixed(2)} Change)` : `Complete ${isCashless ? 'Cashless' : 'Cash'} Sale`)}
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
