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
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: showReceiptPreview ? '750px' : '460px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 24px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'max-width 0.2s ease',
      }}>
        {/* Success Icon & Queue # */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            border: '2px solid var(--brand-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-green)',
          }}>
            <CheckCircle2 size={30} />
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Sale Successfully Recorded
          </span>

          {/* Huge Queue Number */}
          <div style={{
            background: 'var(--bg-app)',
            border: '2px dashed var(--brand-red)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>QUEUE NUMBER</span>
            <span style={{ fontSize: '3.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)', lineHeight: 1 }}>
              #{String(order.queueNo || 0).padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Order Details Summary */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.88rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Order Type:</span>
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{order.orderType?.replace('_', ' ')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{order.paymentMethod === 'cashless' ? 'CASHLESS / QR' : order.paymentMethod}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Charged:</span>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>₱{order.total.toFixed(2)}</span>
          </div>
          {order.changeDue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Change Given:</span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
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
            border: '1px solid #cbd5e1',
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
            style={{ flex: 2, padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}
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
