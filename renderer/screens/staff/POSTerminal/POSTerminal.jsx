// renderer/screens/staff/POSTerminal/POSTerminal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useShift } from '../../../context/ShiftContext';
import { ShiftOpenModal } from '../../ShiftOpen/ShiftOpenModal';
import { ShiftCloseModal } from './ShiftCloseModal';
import { VariantPickerModal } from './VariantPickerModal';
import { DiscountModal } from './DiscountModal';
import { PaymentModal } from './PaymentModal';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { RecentOrdersModal } from './RecentOrdersModal';
import { CashOutModal } from './CashOutModal';
import logoImg from '../../../assets/logo.png';
import {
  Lock,
  LogOut,
  ShoppingCart,
  UtensilsCrossed,
  Receipt,
  Trash2,
  Plus,
  Minus,
  Tag,
  PauseCircle,
  DollarSign,
  HandCoins,
  Coins,
  Flame,
  Utensils,
  CupSoda,
  Layers,
  X
} from 'lucide-react';
import { ORDER_TYPES } from '@shared/constants.js';

function getCategoryIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('tako')) return <Flame size={15} strokeWidth={2.2} />;
  if (lower.includes('siomai')) return <Utensils size={15} strokeWidth={2.2} />;
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice')) return <CupSoda size={15} strokeWidth={2.2} />;
  return <Layers size={15} strokeWidth={2.2} />;
}

export function POSTerminal({ embedded = false }) {
  const { user, sessionId, logout, lockScreen } = useAuth();
  const { currentShift, showOpenModal, setShowOpenModal, showCloseModal, setShowCloseModal } = useShift();

  // Catalog State
  const [catalog, setCatalog] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState(ORDER_TYPES.DINE_IN);
  const [discount, setDiscount] = useState(null); // { type, amount, reason }
  const [heldOrders, setHeldOrders] = useState([]); // Parked orders

  // Modal States
  const [activePickerProduct, setActivePickerProduct] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // 1. Fetch full catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      setLoadingCatalog(true);
      try {
        if (window.api?.menu?.getCatalog) {
          const res = await window.api.menu.getCatalog(sessionId);
          if (res.success && res.data) {
            setCatalog(res.data);
            if (res.data.length > 0) {
              setSelectedCategoryId(res.data[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load menu catalog:', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, [sessionId]);

  // Cart Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = discount?.amount || 0;
  const totalDue = Math.max(0, subtotal - discountAmount);

  // Cart Item Handlers
  const handleAddToCart = (configuredItem) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item =>
        item.variantId === configuredItem.variantId &&
        item.modifierIds.slice().sort().join(',') === configuredItem.modifierIds.slice().sort().join(',')
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const nextQty = existing.qty + configuredItem.qty;
        const singleItemPrice = existing.lineTotal / existing.qty;
        updated[existingIdx] = {
          ...existing,
          qty: nextQty,
          lineTotal: singleItemPrice * nextQty,
        };
        return updated;
      }
      return [...prev, configuredItem];
    });
  };

  const updateItemQty = (index, delta) => {
    setCartItems(prev => {
      const target = prev[index];
      const nextQty = target.qty + delta;
      if (nextQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const singlePrice = target.lineTotal / target.qty;
      const updated = [...prev];
      updated[index] = {
        ...target,
        qty: nextQty,
        lineTotal: singlePrice * nextQty,
      };
      return updated;
    });
  };

  const removeItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(null);
  };

  // Hold / Recall Order (Park cart)
  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    if (heldOrders.length >= 3) {
      alert('Maximum 3 held orders reached. Please process or clear existing held orders.');
      return;
    }

    const newHeld = {
      id: Date.now(),
      savedAt: new Date(),
      items: cartItems,
      orderType,
      discount,
      subtotal,
    };

    setHeldOrders(prev => [...prev, newHeld]);
    clearCart();
  };

  const handleRecallOrder = (heldId) => {
    const target = heldOrders.find(h => h.id === heldId);
    if (!target) return;

    if (cartItems.length > 0) {
      if (!confirm('Current cart has items. Overwrite with recalled order?')) {
        return;
      }
    }

    setCartItems(target.items);
    setOrderType(target.orderType);
    setDiscount(target.discount);
    setHeldOrders(prev => prev.filter(h => h.id !== heldId));
  };

  // Checkout submission
  const handleProcessSale = async (paymentDetails) => {
    if (!currentShift) throw new Error('No open shift');

    const payload = {
      shiftId: currentShift.id,
      orderType,
      paymentMethod: paymentDetails.paymentMethod,
      amountTendered: paymentDetails.amountTendered,
      gcashRefNo: paymentDetails.gcashRefNo,
      discountType: discount?.type || null,
      discountReason: discount?.reason || null,
      discountAmount: discount?.amount || 0,
      items: cartItems.map(item => ({
        variantId: item.variantId,
        qty: item.qty,
        modifierIds: item.modifierIds,
      })),
    };

    const res = await window.api.orders.create(sessionId, payload);
    if (!res.success) {
      throw new Error(res.error || 'Failed to complete order');
    }

    setShowPaymentModal(false);
    setCompletedOrder(res.data);
    clearCart();
  };

  const currentCategory = catalog.find(c => c.id === selectedCategoryId);

  const renderCartContent = (isDrawer = false) => (
    <div style={{
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* Cart Header */}
      <div style={{
        padding: embedded ? '12px 16px' : '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
          <ShoppingCart size={17} color="var(--brand-red)" />
          Current Order
          {cartItems.length > 0 && (
            <span className="badge" style={{ backgroundColor: 'var(--brand-red)', color: '#ffffff', padding: '2px 8px', fontSize: '0.75rem' }}>
              {cartItems.reduce((sum, it) => sum + it.qty, 0)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Order Type Toggle (Dine In vs Takeout) */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn"
              style={{
                padding: '4px 10px',
                fontSize: '0.74rem',
                backgroundColor: orderType === ORDER_TYPES.DINE_IN ? 'var(--brand-red)' : 'transparent',
                color: orderType === ORDER_TYPES.DINE_IN ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setOrderType(ORDER_TYPES.DINE_IN)}
            >
              Dine In
            </button>
            <button
              type="button"
              className="btn"
              style={{
                padding: '4px 10px',
                fontSize: '0.74rem',
                backgroundColor: orderType === ORDER_TYPES.TAKEOUT ? 'var(--brand-red)' : 'transparent',
                color: orderType === ORDER_TYPES.TAKEOUT ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setOrderType(ORDER_TYPES.TAKEOUT)}
            >
              Takeout
            </button>
          </div>

          {isDrawer && (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setMobileCartOpen(false)}
              aria-label="Close cart"
              style={{ width: '32px', height: '32px' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Parked/Held Orders Indicator */}
      {heldOrders.length > 0 && (
        <div style={{
          background: '#fffbeb',
          borderBottom: '1px solid #fef3c7',
          padding: embedded ? '6px 14px' : '8px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          flexShrink: 0,
        }}>
          <span style={{ color: '#b45309', fontWeight: 600 }}>
            {heldOrders.length} Held Order{heldOrders.length > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            onClick={() => handleRecallOrder(heldOrders[0].id)}
          >
            Resume
          </button>
        </div>
      )}

      {/* Cart Items List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: embedded ? '8px 12px' : '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {cartItems.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            gap: '8px',
            minHeight: '160px',
          }}>
            <ShoppingCart size={40} strokeWidth={1.5} color="var(--border-strong)" />
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No items in current order</div>
            <div style={{ fontSize: '0.8rem' }}>Tap products on the left to add</div>
          </div>
        ) : (
          cartItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {item.productName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {item.variantLabel}
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-red)', marginTop: '2px' }}>
                      + {item.modifiers.map(m => m.name).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  ₱{item.lineTotal.toFixed(2)}
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius-sm)' }}
                    onClick={() => updateItemQty(idx, -1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '18px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius-sm)' }}
                    onClick={() => updateItemQty(idx, 1)}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => removeItem(idx)}
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div style={{
        padding: embedded ? '12px 16px' : '16px 20px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
      }}>
        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Subtotal</span>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₱{subtotal.toFixed(2)}</span>
        </div>

        {/* Discount Button / Applied Discount */}
        {discount ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--brand-green-light)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--brand-green)',
            fontWeight: 700,
          }}>
            <span>Discount ({discount.reason || discount.type})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>-₱{discountAmount.toFixed(2)}</span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--brand-green)', cursor: 'pointer', padding: 0 }}
                onClick={() => setDiscount(null)}
                title="Remove discount"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }}
            onClick={() => setShowDiscountModal(true)}
            disabled={cartItems.length === 0}
          >
            <Tag size={14} />
            Apply Discount (Senior / PWD / Promo)
          </button>
        )}

        {/* Total Due */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '1.25rem',
          fontWeight: 800,
        }}>
          <span>Total Due</span>
          <span style={{ color: 'var(--brand-red)', fontFamily: 'var(--font-mono)' }}>
            ₱{totalDue.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons: Hold Order & Pay */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: embedded ? '10px' : '12px', flex: 1, fontSize: embedded ? '0.85rem' : '0.9rem' }}
            onClick={handleHoldOrder}
            disabled={cartItems.length === 0}
            title="Park this cart temporarily to serve next customer"
          >
            <PauseCircle size={15} />
            Hold
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: embedded ? '10px' : '12px',
              flex: 2,
              fontSize: embedded ? '0.96rem' : '1.05rem',
              fontWeight: 800,
              backgroundColor: !currentShift ? 'var(--brand-green)' : 'var(--brand-red)',
              borderColor: !currentShift ? 'var(--brand-green)' : 'var(--brand-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => {
              if (!currentShift) {
                setShowOpenModal(true);
                return;
              }
              setShowPaymentModal(true);
              if (isDrawer) setMobileCartOpen(false);
            }}
            disabled={currentShift ? cartItems.length === 0 : false}
          >
            {!currentShift ? (
              <>
                <Coins size={17} />
                Open Shift to Sell
              </>
            ) : (
              `Pay ₱${totalDue.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: embedded ? '100%' : '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-app)',
      overflow: 'hidden',
      minHeight: 0,
      flex: 1,
    }}>
      {/* If no shift is open, show Open Shift Modal */}
      {showOpenModal && <ShiftOpenModal onClose={() => setShowOpenModal(false)} />}

      {/* Close Shift Modal */}
      {showCloseModal && <ShiftCloseModal onClose={() => setShowCloseModal(false)} />}

      {/* Top Application Header */}
      <header className="pos-top-navbar" style={{
        height: embedded ? '44px' : '62px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: embedded ? '0 14px' : '0 18px',
        boxShadow: embedded ? 'none' : 'var(--shadow-sm)',
        zIndex: 5,
        flexShrink: 0,
        gap: '12px',
      }}>
        {embedded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {currentShift ? (
              <div className="pos-shift-pill" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--brand-green)', flexShrink: 0 }} />
                <span className="shift-prefix-group" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <span className="shift-prefix">Shift </span>#{currentShift.id}
                  <span style={{ color: 'var(--text-faint)', margin: '0 4px' }}>•</span>
                </span>
                <span className="pos-queue-text" style={{ color: 'var(--brand-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  <span className="queue-prefix">Queue </span>#{String(currentShift.last_queue_no).padStart(3, '0')}
                </span>
              </div>
            ) : null}
            <span className="pos-embedded-status-text" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
              Store POS Terminal Active
            </span>
          </div>
        ) : (
          <div className="pos-brand-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <img src={logoImg} alt="TAKOTIME" className="pos-brand-logo" style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ flexShrink: 0 }}>
              <div className="pos-brand-title" style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                TAKOTIME
              </div>
              <div className="pos-branch-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Montalban Branch • Store Terminal
              </div>
            </div>
          </div>
        )}

        <div className="pos-top-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {!embedded && currentShift && (
            <div className="pos-shift-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--brand-green)', flexShrink: 0 }} />
              <span className="shift-prefix-group" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span className="shift-prefix">Shift </span>#{currentShift.id}
                <span style={{ color: 'var(--text-faint)', margin: '0 4px' }}>•</span>
              </span>
              <span className="pos-queue-text" style={{ color: 'var(--brand-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                <span className="queue-prefix">Queue </span>#{String(currentShift.last_queue_no).padStart(3, '0')}
              </span>
            </div>
          )}

          {!embedded && !currentShift && (
            <div className="pos-shift-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '0.8rem',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#dc2626', flexShrink: 0 }} />
              <span style={{ color: '#dc2626', fontWeight: 700 }}>No Active Shift</span>
            </div>
          )}

          {currentShift ? (
            <>
              {/* Recent Orders button */}
              <button
                type="button"
                className="btn btn-secondary pos-nav-btn"
                style={{ padding: embedded ? '6px 10px' : '7px 12px', fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                onClick={() => setShowRecentOrders(true)}
                title="Recent Orders"
              >
                <Receipt size={15} />
                <span className="pos-nav-btn-text">Recent Orders</span>
              </button>

              {/* Cash Out / Petty Cash button */}
              <button
                type="button"
                className="btn btn-secondary pos-nav-btn"
                style={{ padding: embedded ? '6px 10px' : '7px 12px', fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                onClick={() => setShowCashOutModal(true)}
                title="Record Petty Cash Out"
              >
                <HandCoins size={15} />
                <span className="pos-nav-btn-text">Cash Out</span>
              </button>

              {/* Close Shift button */}
              <button
                type="button"
                className="btn btn-secondary pos-nav-btn"
                style={{ padding: embedded ? '6px 10px' : '7px 12px', fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                onClick={() => setShowCloseModal(true)}
                title="Close Shift"
              >
                <DollarSign size={15} />
                <span className="pos-nav-btn-text">Close Shift</span>
              </button>
            </>
          ) : (
            /* Open Shift button */
            <button
              type="button"
              className="btn pos-nav-btn"
              style={{
                padding: embedded ? '6px 12px' : '7px 14px',
                fontSize: '0.82rem',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                backgroundColor: 'var(--brand-green)',
                borderColor: 'var(--brand-green)',
                color: '#ffffff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                cursor: 'pointer',
              }}
              onClick={() => setShowOpenModal(true)}
              title="Open Work Shift"
            >
              <Coins size={15} />
              <span className="pos-nav-btn-text">Open Shift</span>
            </button>
          )}

          {!embedded && (
            <>
              {/* Cashier Badge */}
              <div className="pos-cashier-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                <span className="badge badge-staff">Staff</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </span>
              </div>

              {/* Lock */}
              <button
                type="button"
                className="btn btn-secondary pos-nav-btn pos-icon-btn"
                style={{ padding: '8px 10px', flexShrink: 0 }}
                onClick={lockScreen}
                title="Lock Terminal"
              >
                <Lock size={15} />
              </button>

              {/* Logout */}
              <button
                type="button"
                className="btn btn-danger pos-nav-btn pos-icon-btn"
                style={{ padding: '8px 10px', flexShrink: 0 }}
                onClick={logout}
                title="Log Out"
              >
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Screen Layout */}
      <main className="pos-main-grid" style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 390px',
        overflow: 'hidden',
      }}>
        {/* Left: Category Tabs & Product Grid */}
        <section className="pos-catalog-section" style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          padding: embedded ? '14px 18px' : '18px 22px',
          gap: '14px',
        }}>
          {!currentShift && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <Coins size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>No active cashier shift. Open a shift to record starting drawer cash and start selling.</span>
              </div>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: 'var(--brand-green)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-sm)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
                }}
                onClick={() => setShowOpenModal(true)}
              >
                Open Shift Now
              </button>
            </div>
          )}

          {/* Category Tabs */}
          <div className="pos-category-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', flexWrap: 'nowrap', flexShrink: 0, paddingBottom: '2px' }}>
            {catalog.map(cat => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="btn"
                  style={{
                    padding: embedded ? '8px 16px' : '10px 20px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    backgroundColor: isSelected ? 'var(--brand-red)' : '#ffffff',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    borderColor: isSelected ? 'var(--brand-red)' : 'var(--border-subtle)',
                    boxShadow: isSelected ? '0 2px 8px rgba(224, 26, 34, 0.25)' : 'var(--shadow-sm)',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', opacity: isSelected ? 1 : 0.8 }}>
                    {getCategoryIcon(cat.name)}
                  </span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '14px',
            alignContent: 'start',
            paddingRight: '6px',
            paddingBottom: '85px',
          }}>
            {loadingCatalog ? (
              <div style={{ color: 'var(--text-muted)', padding: '24px' }}>Loading menu items...</div>
            ) : currentCategory?.products?.map((product) => {
              const lowestPrice = Math.min(...product.variants.map(v => v.price));
              const highestPrice = Math.max(...product.variants.map(v => v.price));
              const priceDisplay = lowestPrice === highestPrice ? `₱${lowestPrice.toFixed(2)}` : `₱${lowestPrice.toFixed(0)} - ₱${highestPrice.toFixed(0)}`;

              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease',
                    boxShadow: 'var(--shadow-sm)',
                    minHeight: '155px',
                  }}
                  onClick={() => setActivePickerProduct(product)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-red)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(224, 26, 34, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px', lineHeight: 1.3 }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.variants.map(v => v.label).join(' • ')}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                  }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>
                      {priceDisplay}
                    </span>
                    <span style={{
                      backgroundColor: 'var(--brand-red-light)',
                      color: 'var(--brand-red)',
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}>
                      Select
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Cart & Order Summary */}
        <aside className="pos-desktop-cart" style={{
          backgroundColor: '#ffffff',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {renderCartContent(false)}
        </aside>
      </main>

      {/* Mobile Floating Bottom Cart Bar (< 960px) */}
      <div className="pos-mobile-cart-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={22} color="var(--brand-red)" />
            {cartItems.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-10px',
                backgroundColor: 'var(--brand-red)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '1px 6px',
              }}>
                {cartItems.reduce((sum, it) => sum + it.qty, 0)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Due
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
              ₱{totalDue.toFixed(2)}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: '0.92rem', fontWeight: 700 }}
          onClick={() => setMobileCartOpen(true)}
        >
          View Order ({cartItems.reduce((sum, it) => sum + it.qty, 0)})
        </button>
      </div>

      {/* Mobile Cart Slide-over Drawer (< 960px) */}
      {mobileCartOpen && (
        <div className="pos-mobile-cart-drawer" onClick={() => setMobileCartOpen(false)}>
          <div className="pos-mobile-cart-content" onClick={(e) => e.stopPropagation()}>
            {renderCartContent(true)}
          </div>
        </div>
      )}

      {/* Modals */}
      {activePickerProduct && (
        <VariantPickerModal
          product={activePickerProduct}
          onAddToCart={handleAddToCart}
          onClose={() => setActivePickerProduct(null)}
        />
      )}

      {showDiscountModal && (
        <DiscountModal
          currentDiscount={discount}
          subtotal={subtotal}
          onApply={(d) => setDiscount(d)}
          onClose={() => setShowDiscountModal(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          totalDue={totalDue}
          onComplete={handleProcessSale}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {completedOrder && (
        <OrderConfirmationModal
          order={completedOrder}
          onNewOrder={() => setCompletedOrder(null)}
        />
      )}

      {showRecentOrders && (
        <RecentOrdersModal
          shiftId={currentShift?.id}
          onClose={() => setShowRecentOrders(false)}
        />
      )}

      {showCashOutModal && (
        <CashOutModal
          onClose={() => setShowCashOutModal(false)}
        />
      )}
    </div>
  );
}
