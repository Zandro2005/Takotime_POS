// renderer/screens/admin/Menu/MenuManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Package,
  Layers,
  Sparkles,
  X,
  Save,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export function MenuManagement() {
  const { sessionId } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [globalModifiers, setGlobalModifiers] = useState([]);

  // Modals state
  const [categoryModal, setCategoryModal] = useState({ open: false, data: null });
  const [productModal, setProductModal] = useState({ open: false, data: null, categoryId: null });
  const [variantModal, setVariantModal] = useState({ open: false, data: null, productId: null });
  const [recipeModal, setRecipeModal] = useState({ open: false, variant: null, productName: '', ingredients: [] });
  const [modifiersModal, setModifiersModal] = useState({ open: false, product: null, selectedModifierIds: [] });
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (window.api?.menu?.getCatalog) {
        const res = await window.api.menu.getCatalog(sessionId);
        if (res.success && res.data) {
          setCatalog(res.data);
          if (!selectedCategoryId && res.data.length > 0) {
            setSelectedCategoryId(res.data[0].id);
          }
        }
      }

      if (window.api?.inventory?.getItems) {
        const invRes = await window.api.inventory.getItems(sessionId);
        if (invRes.success && invRes.data) {
          setInventoryItems(invRes.data);
        }
      }

      if (window.api?.menu?.getModifiers) {
        const modRes = await window.api.menu.getModifiers(sessionId, 1);
        if (modRes.success && modRes.data) {
          setGlobalModifiers(modRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load menu admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const selectedCategory = catalog.find(c => c.id === selectedCategoryId) || catalog[0];

  // Category Actions
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const name = e.target.categoryName.value.trim();
    if (!name) return;

    try {
      if (categoryModal.data) {
        await window.api?.menuAdmin?.updateCategory?.(sessionId, { id: categoryModal.data.id, name });
        showToast('Category updated');
      } else {
        await window.api?.menuAdmin?.createCategory?.(sessionId, { name });
        showToast('New category created');
      }
      setCategoryModal({ open: false, data: null });
      await loadData();
    } catch (err) {
      alert('Error saving category: ' + err.message);
    }
  };

  // Product Actions
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const name = e.target.productName.value.trim();
    if (!name) return;

    try {
      if (productModal.data) {
        await window.api?.menuAdmin?.updateProduct?.(sessionId, { id: productModal.data.id, name });
        showToast('Product updated');
      } else {
        await window.api?.menuAdmin?.createProduct?.(sessionId, {
          name,
          categoryId: productModal.categoryId || selectedCategoryId,
        });
        showToast('New product created');
      }
      setProductModal({ open: false, data: null, categoryId: null });
      await loadData();
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  // Variant Actions
  const handleSaveVariant = async (e) => {
    e.preventDefault();
    const label = e.target.variantLabel.value.trim();
    const price = Number(e.target.variantPrice.value);
    const cost = Number(e.target.variantCost.value) || 0;

    if (!label || isNaN(price) || price < 0) {
      alert('Please enter a valid label and non-negative price');
      return;
    }

    try {
      if (variantModal.data) {
        await window.api?.menuAdmin?.updateVariant?.(sessionId, {
          id: variantModal.data.id,
          label,
          price,
          cost,
        });
        showToast('Variant updated');
      } else {
        await window.api?.menuAdmin?.createVariant?.(sessionId, {
          productId: variantModal.productId,
          label,
          price,
          cost,
        });
        showToast('New variant created');
      }
      setVariantModal({ open: false, data: null, productId: null });
      await loadData();
    } catch (err) {
      alert('Error saving variant: ' + err.message);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Are you sure you want to remove this variant? If it was already sold in previous orders, it will be safely deactivated.')) {
      return;
    }
    try {
      await window.api?.menuAdmin?.deleteVariant?.(sessionId, variantId);
      showToast('Variant removed');
      await loadData();
    } catch (err) {
      alert('Error removing variant: ' + err.message);
    }
  };

  // Recipe Actions
  const handleOpenRecipe = async (product, variant) => {
    try {
      let ingredients = [];
      if (window.api?.recipes?.get) {
        const res = await window.api.recipes.get(sessionId, variant.id);
        if (res.success && res.data) {
          ingredients = res.data.ingredients || [];
        }
      }
      setRecipeModal({
        open: true,
        variant,
        productName: product.name,
        ingredients,
      });
    } catch (err) {
      alert('Failed to load recipe: ' + err.message);
    }
  };

  const handleAddRecipeIngredient = () => {
    if (inventoryItems.length === 0) return;
    setRecipeModal(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          inventoryItemId: inventoryItems[0].itemId || 1,
          name: inventoryItems[0].name,
          unit: inventoryItems[0].unit,
          qtyPerUnit: 0.1,
        },
      ],
    }));
  };

  const handleUpdateRecipeIngredient = (index, field, value) => {
    setRecipeModal(prev => {
      const updated = [...prev.ingredients];
      const target = { ...updated[index] };
      if (field === 'inventoryItemId') {
        const inv = inventoryItems.find(i => i.itemId === Number(value));
        target.inventoryItemId = Number(value);
        if (inv) {
          target.name = inv.name;
          target.unit = inv.unit;
        }
      } else if (field === 'qtyPerUnit') {
        target.qtyPerUnit = Number(value);
      }
      updated[index] = target;
      return { ...prev, ingredients: updated };
    });
  };

  const handleRemoveRecipeIngredient = (index) => {
    setRecipeModal(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSaveRecipe = async () => {
    try {
      if (window.api?.recipes?.update) {
        await window.api.recipes.update(sessionId, recipeModal.variant.id, recipeModal.ingredients);
        showToast(`Saved recipe for ${recipeModal.variant.label}`);
        setRecipeModal({ open: false, variant: null, productName: '', ingredients: [] });
        await loadData();
      }
    } catch (err) {
      alert('Failed to save recipe: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 2,
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <UtensilsCrossed size={22} color="var(--brand-red)" />
            Menu & Recipe Catalog
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {toastMessage && (
            <span style={{
              backgroundColor: 'var(--brand-green-light)',
              color: 'var(--brand-green)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <CheckCircle2 size={16} />
              {toastMessage}
            </span>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 14px' }}
            onClick={() => setCategoryModal({ open: true, data: null })}
          >
            <FolderPlus size={16} color="var(--brand-gold)" />
            + New Category
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
            onClick={() => setProductModal({ open: true, data: null, categoryId: selectedCategoryId })}
          >
            <Plus size={16} />
            + Add Product
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        whiteSpace: 'nowrap',
      }}>
        {catalog.map(cat => {
          const isActive = cat.id === selectedCategoryId;
          return (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                style={{
                  padding: '14px 8px',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.92rem',
                  color: isActive ? 'var(--brand-red)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '3px solid var(--brand-red)' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <span>{cat.name}</span>
                <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}>
                  {cat.products.length}
                </span>
              </button>

              <button
                type="button"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-faint)' }}
                onClick={() => setCategoryModal({ open: true, data: cat })}
                title="Edit Category Name"
              >
                <Edit2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main Content: Products List */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Loading menu items...
          </div>
        ) : !selectedCategory || selectedCategory.products.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '60px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '40px auto',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Package size={48} color="var(--brand-gold)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              No Products in this Category
            </h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setProductModal({ open: true, data: null, categoryId: selectedCategoryId })}
            >
              <Plus size={16} />
              Add First Product
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {selectedCategory.products.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                {/* Product Title Bar */}
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <Package size={20} color="var(--brand-red)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {product.name}
                    </h2>
                    <span className="badge" style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {product.variants.length} variant{product.variants.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setProductModal({ open: true, data: product, categoryId: selectedCategoryId })}
                    >
                      <Edit2 size={13} />
                      Rename
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setVariantModal({ open: true, data: null, productId: product.id })}
                    >
                      <Plus size={14} color="var(--brand-green)" />
                      + Add Size / Variant
                    </button>
                  </div>
                </div>

                {/* Variants Table */}
                <div className="responsive-table-wrapper" style={{ padding: '0 20px 16px 20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 8px' }}>Variant Label</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Selling Price</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Unit Cost</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Gross Margin</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center' }}>BOM Recipe Status</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => {
                        const marginPercent = variant.price > 0 ? (((variant.price - (variant.cost || 0)) / variant.price) * 100).toFixed(0) : 0;
                        return (
                          <tr key={variant.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            {/* Label */}
                            <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {variant.label}
                            </td>

                            {/* Price */}
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-red)' }}>
                              ₱{variant.price.toFixed(2)}
                            </td>

                            {/* Cost */}
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                              ₱{(variant.cost || 0).toFixed(2)}
                            </td>

                            {/* Margin */}
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-green)' }}>
                              {marginPercent}%
                            </td>

                            {/* Recipe BOM Link */}
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '0.78rem',
                                  borderColor: 'var(--border-subtle)',
                                  backgroundColor: 'var(--bg-surface-elevated)',
                                }}
                                onClick={() => handleOpenRecipe(product, variant)}
                              >
                                <Layers size={14} color="var(--brand-gold)" />
                                Configure Recipe (BOM)
                              </button>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                                  onClick={() => setVariantModal({ open: true, data: variant, productId: product.id })}
                                  title="Edit Price & Cost"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                                  onClick={() => handleDeleteVariant(variant.id)}
                                  title="Remove Variant"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe BOM Editor Modal */}
      {recipeModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '28px',
            maxWidth: '620px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} color="var(--brand-red)" />
                  Bill of Materials (BOM Recipe)
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {recipeModal.productName} — <strong>{recipeModal.variant?.label}</strong>
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setRecipeModal({ open: false, variant: null, productName: '', ingredients: [] })}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Info size={18} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Each completed POS sale of this variant will automatically compute and deduct these exact ingredient quantities from the store inventory.
              </div>
            </div>

            {/* Ingredient Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recipeModal.ingredients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  No recipe ingredients configured yet.
                </div>
              ) : (
                recipeModal.ingredients.map((ing, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '10px', alignItems: 'center' }}>
                    <select
                      value={ing.inventoryItemId}
                      onChange={(e) => handleUpdateRecipeIngredient(idx, 'inventoryItemId', e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        backgroundColor: '#ffffff',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        outline: 'none',
                      }}
                    >
                      {inventoryItems.map(inv => (
                        <option key={inv.itemId} value={inv.itemId}>
                          {inv.name} ({inv.unit})
                        </option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={ing.qtyPerUnit}
                        onChange={(e) => handleUpdateRecipeIngredient(idx, 'qtyPerUnit', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          textAlign: 'right',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {ing.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '8px' }}
                      onClick={() => handleRemoveRecipeIngredient(idx)}
                      title="Remove Ingredient"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', marginTop: '6px', padding: '8px 14px', fontSize: '0.85rem' }}
                onClick={handleAddRecipeIngredient}
              >
                <Plus size={15} color="var(--brand-green)" />
                + Add Ingredient Row
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setRecipeModal({ open: false, variant: null, productName: '', ingredients: [] })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
                onClick={handleSaveRecipe}
              >
                <Save size={16} />
                Save BOM Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {categoryModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {categoryModal.data ? 'Edit Category' : 'Create New Category'}
            </h2>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Category Name
                </label>
                <input
                  name="categoryName"
                  defaultValue={categoryModal.data?.name || ''}
                  required
                  autoFocus
                  placeholder="e.g. Rice Bowls"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setCategoryModal({ open: false, data: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {productModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {productModal.data ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Product Name
                </label>
                <input
                  name="productName"
                  defaultValue={productModal.data?.name || ''}
                  required
                  autoFocus
                  placeholder="e.g. Spicy Cheese Takoyaki"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setProductModal({ open: false, data: null, categoryId: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {variantModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {variantModal.data ? 'Edit Variant & Pricing' : 'Add Size / Variant'}
            </h2>

            <form onSubmit={handleSaveVariant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Size / Variant Label
                </label>
                <input
                  name="variantLabel"
                  defaultValue={variantModal.data?.label || ''}
                  required
                  autoFocus
                  placeholder="e.g. 16 pcs Box"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Selling Price (₱)
                  </label>
                  <input
                    name="variantPrice"
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={variantModal.data?.price || ''}
                    required
                    placeholder="120.00"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--brand-red)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Ingredient Cost (₱)
                  </label>
                  <input
                    name="variantCost"
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={variantModal.data?.cost || '0'}
                    placeholder="45.00"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setVariantModal({ open: false, data: null, productId: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Save Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
