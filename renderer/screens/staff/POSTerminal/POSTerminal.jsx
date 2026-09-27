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
  DollarSign
} from 'lucide-react';
import { ORDER_TYPES } from '@shared/constants.js';

export function POSTerminal({ embedded = false }) {
  const { user, sessionId, logout, lockScreen } = useAuth();
  const { currentShift, showOpenModal, showCloseModal, setShowCloseModal } = useShift();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-app)' }}>
      {/* If no shift is open, show Open Shift Modal */}
      {showOpenModal && <ShiftOpenModal />}

      {/* Close Shift Modal */}
      {showCloseModal && <ShiftCloseModal onClose={() => setShowCloseModal(false)} />}

      {/* Top Application Header */}
      <header style={{
        height: embedded ? '48px' : '62px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: embedded ? 'none' : 'var(--shadow-sm)',
        zIndex: 5,
      }}>
        {embedded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentShift ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Shift #{currentShift.id}</span>
                <span style={{ color: 'var(--text-faint)' }}>•</span>
                <span style={{ color: 'var(--brand-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  Queue #{String(currentShift.last_queue_no).padStart(3, '0')}
                </span>
              </div>
            ) : null}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Store POS Terminal Active
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logoImg} alt="TAKOTIME" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: 1.1 }}>
                TAKOTIME
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                Montalban Branch • Store Terminal
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!embedded && currentShift && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Shift #{currentShift.id}</span>
              <span style={{ color: 'var(--text-faint)' }}>•</span>
              <span style={{ color: 'var(--brand-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                Queue #{String(currentShift.last_queue_no).padStart(3, '0')}
              </span>
            </div>
          )}

          {/* Recent Orders button */}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: embedded ? '6px 12px' : '8px 12px', fontSize: '0.82rem' }}
            onClick={() => setShowRecentOrders(true)}
          >
            <Receipt size={15} />
            Recent Orders
          </button>

          {/* Close Shift button */}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: embedded ? '6px 12px' : '8px 12px', fontSize: '0.82rem' }}
            onClick={() => setShowCloseModal(true)}
          >
            <DollarSign size={15} />
            Close Shift
          </button>

          {!embedded && (
            <>
              {/* Cashier Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                <span className="badge badge-staff">Staff</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{user?.name}</span>
              </div>

              {/* Lock */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 10px' }}
                onClick={lockScreen}
                title="Lock Terminal"
              >
                <Lock size={16} />
              </button>

              {/* Logout */}
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '8px 10px' }}
                onClick={logout}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Screen Layout */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        overflow: 'hidden',
      }}>
        {/* Left: Category Tabs & Product Grid */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '20px 24px',
          gap: '16px',
        }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {catalog.map(cat => {
              const isSelected = cat.id === selectedCategoryId;
              const emoji = cat.name.includes('Takoyaki') ? '🐙 ' : cat.name.includes('Siomai') ? '🥟 ' : '🥤 ';
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="btn"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    backgroundColor: isSelected ? 'var(--brand-red)' : '#ffffff',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    borderColor: isSelected ? 'var(--brand-red)' : 'var(--border-subtle)',
                    boxShadow: isSelected ? '0 2px 6px rgba(224, 26, 34, 0.25)' : 'var(--shadow-sm)',
                  }}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {emoji}{cat.name}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '16px',
            alignContent: 'start',
            paddingRight: '6px',
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
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease',
                    boxShadow: 'var(--shadow-sm)',
                    minHeight: '140px',
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
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {product.variants.map(v => v.label).join(' • ')}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '14px',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px',
                  }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>
                      {priceDisplay}
                    </span>
                    <span style={{
                      backgroundColor: 'var(--brand-red-light)',
                      color: 'var(--brand-red)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
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
        <aside style={{
          backgroundColor: '#ffffff',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* Cart Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
              <ShoppingCart size={18} color="var(--brand-red)" />
              Current Order
              {cartItems.length > 0 && (
                <span className="badge" style={{ backgroundColor: 'var(--brand-red)', color: '#ffffff' }}>
                  {cartItems.reduce((sum, it) => sum + it.qty, 0)}
                </span>
              )}
            </div>

            {/* Order Type Toggle (Dine In vs Takeout) */}
            <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: orderType === ORDER_TYPES.DINE_IN ? 'var(--brand-red)' : 'transparent',
                  color: orderType === ORDER_TYPES.DINE_IN ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 700,
                }}
                onClick={() => setOrderType(ORDER_TYPES.DINE_IN)}
              >
                Dine In
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: orderType === ORDER_TYPES.TAKEOUT ? 'var(--brand-red)' : 'transparent',
                  color: orderType === ORDER_TYPES.TAKEOUT ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 700,
                }}
                onClick={() => setOrderType(ORDER_TYPES.TAKEOUT)}
              >
                Takeout
              </button>
            </div>
          </div>

          {/* Parked/Held Orders Indicator */}
          {heldOrders.length > 0 && (
            <div style={{
              background: '#fffbeb',
              borderBottom: '1px solid #fef3c7',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700 }}>
                Parked Orders ({heldOrders.length})
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {heldOrders.map((h, idx) => (
                  <button
                    key={h.id}
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#b45309', borderColor: '#fde68a' }}
                    onClick={() => handleRecallOrder(h.id)}
                  >
                    Recall #{idx + 1} (₱{h.subtotal})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: '#ffffff',
          }}>
            {cartItems.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-faint)',
                gap: '8px',
              }}>
                <UtensilsCrossed size={36} strokeWidth={1.5} />
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cart is empty</p>
                <p style={{ fontSize: '0.75rem' }}>Select items from the menu to start order</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Variant: {item.variantLabel}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-main)' }}>
                      ₱{item.lineTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Modifiers List */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {item.modifiers.map(m => (
                        <span key={m.id} style={{ background: 'var(--brand-gold-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          +{m.name} {m.price_delta > 0 ? `(₱${m.price_delta})` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Qty controls & delete */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => updateItemQty(index, -1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', width: '20px', textAlign: 'center', color: 'var(--text-main)' }}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => updateItemQty(index, 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer & Checkout Panel */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₱{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.78rem', color: discount ? 'var(--brand-green)' : undefined }}
                onClick={() => setShowDiscountModal(true)}
                disabled={cartItems.length === 0}
              >
                <Tag size={13} />
                {discount ? `Discount (${discount.type.toUpperCase()})` : 'Add Discount'}
              </button>

              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', fontWeight: 700 }}>
                {discount ? `-₱${discountAmount.toFixed(2)}` : '₱0.00'}
              </span>
            </div>

            {/* Total Due */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.35rem', fontWeight: 900, borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-main)' }}>Total Due:</span>
              <span style={{ color: 'var(--brand-red)', fontFamily: 'var(--font-mono)' }}>
                ₱{totalDue.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons: Hold Order & Pay */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '13px', flex: 1, fontSize: '0.9rem' }}
                onClick={handleHoldOrder}
                disabled={cartItems.length === 0}
                title="Park this cart temporarily to serve next customer"
              >
                <PauseCircle size={17} />
                Hold
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '13px', flex: 2, fontSize: '1.05rem', fontWeight: 800 }}
                onClick={() => setShowPaymentModal(true)}
                disabled={cartItems.length === 0}
              >
                Pay ₱{totalDue.toFixed(2)}
              </button>
            </div>
          </div>
        </aside>
      </main>

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
    </div>
  );
}
