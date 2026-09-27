// renderer/screens/staff/POSTerminal/DiscountModal.jsx
import React, { useState } from 'react';
import { X, Percent, Tag, UserCheck } from 'lucide-react';
import { DISCOUNT_TYPES } from '@shared/constants.js';

export function DiscountModal({ currentDiscount, subtotal, onApply, onClose }) {
  const [discountType, setDiscountType] = useState(currentDiscount?.type || DISCOUNT_TYPES.SENIOR);
  const [customAmount, setCustomAmount] = useState(currentDiscount?.amount?.toString() || '');
  const [reason, setReason] = useState(currentDiscount?.reason || '');

  const calculatePreview = () => {
    if (discountType === DISCOUNT_TYPES.SENIOR || discountType === DISCOUNT_TYPES.PWD) {
      return Math.round(subtotal * 0.20 * 100) / 100;
    }
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) ? 0 : Math.min(subtotal, parsed);
  };

  const handleSave = () => {
    const amt = calculatePreview();
    onApply({
      type: discountType,
      amount: amt,
      reason: reason.trim() || (discountType === DISCOUNT_TYPES.SENIOR ? 'Senior Citizen' : discountType === DISCOUNT_TYPES.PWD ? 'PWD' : 'Promo'),
    });
    onClose();
  };

  const handleRemove = () => {
    onApply(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9992,
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Apply Order Discount</h2>
          <button type="button" className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Discount Type Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${discountType === DISCOUNT_TYPES.SENIOR ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '12px 6px', gap: '4px' }}
            onClick={() => setDiscountType(DISCOUNT_TYPES.SENIOR)}
          >
            <UserCheck size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Senior (20%)</span>
          </button>

          <button
            type="button"
            className={`btn ${discountType === DISCOUNT_TYPES.PWD ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '12px 6px', gap: '4px' }}
            onClick={() => setDiscountType(DISCOUNT_TYPES.PWD)}
          >
            <Percent size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>PWD (20%)</span>
          </button>

          <button
            type="button"
            className={`btn ${discountType === DISCOUNT_TYPES.PROMO ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '12px 6px', gap: '4px' }}
            onClick={() => setDiscountType(DISCOUNT_TYPES.PROMO)}
          >
            <Tag size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Custom / Promo</span>
          </button>
        </div>

        {discountType === DISCOUNT_TYPES.PROMO && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Discount Amount (₱)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="input-field"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            ID / Reference / Reason
          </label>
          <input
            type="text"
            className="input-field"
            placeholder={discountType === DISCOUNT_TYPES.SENIOR ? 'Enter Senior Citizen ID #' : discountType === DISCOUNT_TYPES.PWD ? 'Enter PWD ID #' : 'Promo details'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Calculated preview */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimated Deduction:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}>
            -₱{calculatePreview().toFixed(2)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {currentDiscount && (
            <button type="button" className="btn btn-danger" style={{ flex: 1, padding: '12px' }} onClick={handleRemove}>
              Remove
            </button>
          )}
          <button type="button" className="btn btn-primary" style={{ flex: 2, padding: '12px' }} onClick={handleSave}>
            Apply Discount
          </button>
        </div>
      </div>
    </div>
  );
}
