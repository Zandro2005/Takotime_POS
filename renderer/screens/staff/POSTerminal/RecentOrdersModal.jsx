// renderer/screens/staff/POSTerminal/RecentOrdersModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Receipt, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ORDER_STATUS } from '@shared/constants.js';

export function RecentOrdersModal({ shiftId, onClose }) {
  const { sessionId, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptText, setSelectedReceiptText] = useState(null);
  const [voidingOrderId, setVoidingOrderId] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (window.api?.orders?.getRecent && shiftId) {
        const res = await window.api.orders.getRecent(sessionId, shiftId, 20);
        if (res.success) {
          setOrders(res.data || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [shiftId]);

  const handlePreviewReceipt = async (orderId) => {
    try {
      const res = await window.api.receipt.format(sessionId, orderId);
      if (res.success && res.data) {
        setSelectedReceiptText(res.data.formattedText);
      }
    } catch (err) {
      alert('Error loading receipt: ' + err.message);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidReason.trim()) {
      alert('A reason is required to void an order.');
      return;
    }

    try {
      const res = await window.api.orders.void(sessionId, voidingOrderId, voidReason.trim());
      if (res.success) {
        setVoidingOrderId(null);
        setVoidReason('');
        fetchOrders();
      } else {
        alert(res.error || 'Failed to void order');
      }
    } catch (err) {
      alert('Void error: ' + err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9994,
      backgroundColor: 'rgba(9, 13, 22, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: selectedReceiptText ? '900px' : '700px',
        maxHeight: '85vh',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Recent Shift Orders</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Last 20 transactions for Shift #{shiftId}</p>
          </div>
          <button type="button" className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: selectedReceiptText ? '1fr 340px' : '1fr', gap: '20px', overflow: 'hidden' }}>
          {/* Order List */}
          <div style={{ overflowY: 'auto', maxHeight: '55vh', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '6px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No orders taken yet this shift.</div>
            ) : (
              orders.map((ord) => {
                const isVoided = ord.status === ORDER_STATUS.VOIDED;
                return (
                  <div
                    key={ord.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: `1px solid ${isVoided ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: isVoided ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color: isVoided ? '#f87171' : 'var(--brand-primary)',
                      }}>
                        #{String(ord.queue_no).padStart(3, '0')}
                      </span>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          Order #{ord.id} • {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isVoided && <span style={{ color: '#f87171', marginLeft: '8px', fontSize: '0.75rem', fontWeight: 800 }}>[VOIDED]</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {ord.items?.map(it => `${it.qty}x ${it.product_name} (${it.variant_label})`).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          textDecoration: isVoided ? 'line-through' : 'none',
                        }}>
                          ₱{ord.total.toFixed(2)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                          {ord.payment_method}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                        onClick={() => handlePreviewReceipt(ord.id)}
                        title="Reprint Receipt"
                      >
                        <Receipt size={16} />
                      </button>

                      {!isVoided && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                          onClick={() => setVoidingOrderId(ord.id)}
                          title="Void Order"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Receipt Monospace Preview */}
          {selectedReceiptText && (
            <div style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              maxHeight: '55vh',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.25,
              border: '1px solid #ccc',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>RECEIPT PREVIEW</span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => setSelectedReceiptText(null)}
                >
                  ✕
                </button>
              </div>
              {selectedReceiptText}
            </div>
          )}
        </div>

        {/* Void Reason Confirmation Prompt */}
        {voidingOrderId && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>
              <AlertTriangle size={18} />
              Voiding Order #{voidingOrderId} — Audit Reason Required
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Customer cancelled / Made duplicate order by accident"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 14px' }}
                onClick={() => { setVoidingOrderId(null); setVoidReason(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '8px 16px' }}
                onClick={handleConfirmVoid}
              >
                Confirm Void
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
