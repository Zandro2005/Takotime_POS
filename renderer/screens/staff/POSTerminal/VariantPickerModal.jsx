// renderer/screens/staff/POSTerminal/VariantPickerModal.jsx
import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';

export function VariantPickerModal({ product, onAddToCart, onClose }) {
  if (!product) return null;

  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [selectedModifierIds, setSelectedModifierIds] = useState([]);
  const [qty, setQty] = useState(1);

  const toggleModifier = (modId) => {
    setSelectedModifierIds(prev =>
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  const calculateLineTotal = () => {
    if (!selectedVariant) return 0;
    const basePrice = selectedVariant.price;
    const modifierTotal = selectedModifierIds.reduce((sum, modId) => {
      const mod = product.modifiers.find(m => m.id === modId);
      return sum + (mod ? mod.price_delta : 0);
    }, 0);
    return (basePrice + modifierTotal) * qty;
  };

  const handleAdd = () => {
    if (!selectedVariant) return;
    onAddToCart({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantLabel: selectedVariant.label,
      unitPrice: selectedVariant.price,
      modifierIds: selectedModifierIds,
      modifiers: product.modifiers.filter(m => selectedModifierIds.includes(m.id)),
      qty,
      lineTotal: calculateLineTotal(),
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9990,
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{product.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select size / variant and add-ons</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Variants Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Choose Variant / Size
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, product.variants.length)}, 1fr)`, gap: '10px' }}>
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`btn ${selectedVariant?.id === v.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px 8px',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => setSelectedVariant(v)}
              >
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800 }}>
                  ₱{v.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modifiers Selection */}
        {product.modifiers && product.modifiers.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Add-ons & Modifiers (Optional)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {product.modifiers.map((mod) => {
                const isChecked = selectedModifierIds.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className="btn"
                    style={{
                      backgroundColor: isChecked ? 'rgba(255, 87, 34, 0.15)' : 'var(--bg-surface-elevated)',
                      borderColor: isChecked ? 'var(--brand-primary)' : 'var(--border-subtle)',
                      color: isChecked ? 'white' : 'var(--text-main)',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                    }}
                    onClick={() => toggleModifier(mod.id)}
                  >
                    {isChecked ? <Check size={14} color="var(--brand-primary)" /> : null}
                    <span>{mod.name}</span>
                    <span style={{ color: 'var(--brand-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem' }}>
                      {mod.price_delta > 0 ? `+₱${mod.price_delta}` : 'Free'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Quantity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '42px', height: '42px', padding: 0 }}
              onClick={() => setQty(prev => Math.max(1, prev - 1))}
            >
              <Minus size={18} />
            </button>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', width: '32px', textAlign: 'center' }}>
              {qty}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '42px', height: '42px', padding: 0 }}
              onClick={() => setQty(prev => prev + 1)}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1.05rem', justifyContent: 'space-between' }}
          onClick={handleAdd}
          disabled={!selectedVariant}
        >
          <span>Add to Order</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
            ₱{calculateLineTotal().toFixed(2)}
          </span>
        </button>
      </div>
    </div>
  );
}
