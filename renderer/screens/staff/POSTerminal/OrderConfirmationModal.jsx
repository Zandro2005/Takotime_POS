// renderer/screens/staff/POSTerminal/OrderConfirmationModal.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Printer, PlusCircle } from 'lucide-react';

export function OrderConfirmationModal({ order, onNewOrder }) {
  const [receiptText, setReceiptText] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  useEffect(() => {
    // Format receipt preview text
    if (order?.id && window.api?.receipt?.format) {
      window.api.receipt.format(null, order.id).then((res) => {
        if (res.success && res.data) {
          setReceiptText(res.data.formattedText);
        }
      }).catch(console.error);
    }
  }, [order?.id]);

  if (!order) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9995,
      backgroundColor: 'rgba(9, 13, 22, 0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: showReceiptPreview ? '750px' : '480px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        transition: 'max-width 0.2s ease',
      }}>
        {/* Success Icon & Queue # */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid var(--brand-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-accent)',
          }}>
            <CheckCircle2 size={36} />
          </div>

          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Order Completed Successfully
          </span>

          {/* Huge Queue Number */}
          <div style={{
            background: 'var(--bg-app)',
            border: '2px dashed var(--brand-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontWeight: 600 }}>QUEUE NUMBER</span>
            <span style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)', lineHeight: 1 }}>
              #{String(order.queueNo || 0).padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Order Details Summary */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.9rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Order Type:</span>
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{order.orderType?.replace('_', ' ')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Charged:</span>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>₱{order.total.toFixed(2)}</span>
          </div>
          {order.paymentMethod === 'cash' && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Change Given:</span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-accent)' }}>
                ₱{(order.changeDue || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Receipt Preview Toggle */}
        {showReceiptPreview && receiptText && (
          <div style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            maxHeight: '260px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.25,
            border: '1px solid #ccc',
          }}>
            {receiptText}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, padding: '14px' }}
            onClick={() => setShowReceiptPreview(prev => !prev)}
          >
            <Printer size={18} />
            {showReceiptPreview ? 'Hide Receipt' : 'Receipt Preview'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 2, padding: '14px', fontSize: '1.05rem' }}
            onClick={onNewOrder}
            autoFocus
          >
            <PlusCircle size={20} />
            Next Customer
          </button>
        </div>
      </div>
    </div>
  );
}
