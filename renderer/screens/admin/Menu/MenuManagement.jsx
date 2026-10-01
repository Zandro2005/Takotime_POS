// renderer/screens/admin/Menu/MenuManagement.jsx
// Clean, direct-to-the-point Menu & Recipe Management with Category Add-ons
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FolderPlus,
  Package,
  Layers,
  Sparkles,
  X,
  Save,
  Info
} from 'lucide-react';

export function MenuManagement() {
  const { sessionId } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipeCoverageMap, setRecipeCoverageMap] = useState({});

  // Modals state
  const [categoryModal, setCategoryModal] = useState({ open: false, data: null });
  const [productModal, setProductModal] = useState({ open: false, data: null, categoryId: null });
  const [variantModal, setVariantModal] = useState({ open: false, data: null, productId: null });
  const [recipeModal, setRecipeModal] = useState({ open: false, variant: null, productName: '', ingredients: [] });
  const [categoryModifiersModal, setCategoryModifiersModal] = useState({ open: false, category: null });

  // Add-on form states
  const [newModName, setNewModName] = useState('');
  const [newModPrice, setNewModPrice] = useState('');
  const [editingModId, setEditingModId] = useState(null);
  const [editModName, setEditModName] = useState('');
  const [editModPrice, setEditModPrice] = useState('');
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
          setSelectedCategoryId(prevId => {
            const stillExists = res.data.some(c => c.id === prevId);
            if ((!prevId || !stillExists) && res.data.length > 0) {
              return res.data[0].id;
            }
            if (res.data.length === 0) return null;
            return prevId;
          });
        }
      }

      if (window.api?.inventory?.getItems) {
        const invRes = await window.api.inventory.getItems(sessionId);
        if (invRes.success && invRes.data) {
          setInventoryItems(invRes.data);
        }
      }

      if (window.api?.recipes?.getCoverage) {
        const covRes = await window.api.recipes.getCoverage(sessionId);
        if (covRes.success && covRes.data) {
          const map = {};
          for (const item of covRes.data) {
            map[item.variant_id] = item.ingredient_count || 0;
          }
          setRecipeCoverageMap(map);
        }
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
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
        const res = await window.api?.menuAdmin?.createCategory?.(sessionId, { name });
        showToast('New category created');
        if (res?.data?.id) setSelectedCategoryId(res.data.id);
      }
      setCategoryModal({ open: false, data: null });
      await loadData();
    } catch (err) {
      alert('Error saving category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!confirm(`Are you sure you want to delete category "${categoryName}"? Any unsold products inside will be deleted; if any products were previously sold, the category will be safely archived to protect historical sales reports.`)) {
      return;
    }
    try {
      await window.api?.menuAdmin?.deleteCategory?.(sessionId, categoryId);
      showToast(`Category "${categoryName}" deleted`);
      if (categoryModal.open) setCategoryModal({ open: false, data: null });
      await loadData();
    } catch (err) {
      alert('Error deleting category: ' + err.message);
    }
  };

  // Product Actions
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const name = e.target.productName.value.trim();
    const categoryId = Number(e.target.productCategory?.value) || productModal.categoryId || selectedCategoryId;
    if (!name) return;

    try {
      if (productModal.data) {
        await window.api?.menuAdmin?.updateProduct?.(sessionId, { id: productModal.data.id, name, categoryId });
        showToast('Product updated');
      } else {
        await window.api?.menuAdmin?.createProduct?.(sessionId, {
          name,
          categoryId,
        });
        showToast('New product created');
      }
      setProductModal({ open: false, data: null, categoryId: null });
      await loadData();
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!confirm(`Are you sure you want to remove product "${productName}"? (If it was previously sold, it will be safely deactivated to protect historical reports).`)) {
      return;
    }
    try {
      await window.api?.menuAdmin?.deleteProduct?.(sessionId, productId);
      showToast(`Product "${productName}" removed`);
      if (productModal.open) setProductModal({ open: false, data: null, categoryId: null });
      await loadData();
    } catch (err) {
      alert('Error removing product: ' + err.message);
    }
  };

  // Variant Actions
  const handleSaveVariant = async (e) => {
    e.preventDefault();
    const label = e.target.variantLabel.value.trim();
    const price = Number(e.target.variantPrice.value);
    const cost = Number(e.target.variantCost.value) || 0;

    if (!label || isNaN(price) || price < 0) {
      alert('Please enter a valid size label and price');
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
        showToast('Size updated');
      } else {
        await window.api?.menuAdmin?.createVariant?.(sessionId, {
          productId: variantModal.productId,
          label,
          price,
          cost,
        });
        showToast('New size added');
      }
      setVariantModal({ open: false, data: null, productId: null });
      await loadData();
    } catch (err) {
      alert('Error saving size: ' + err.message);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Remove this size? (If it was previously sold, it will be safely deactivated to protect historical reports).')) {
      return;
    }
    try {
      await window.api?.menuAdmin?.deleteVariant?.(sessionId, variantId);
      showToast('Size removed');
      await loadData();
    } catch (err) {
      alert('Error removing size: ' + err.message);
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

  // Category Add-ons Actions
  const handleOpenCategoryModifiers = (category) => {
    const latestCat = catalog.find(c => c.id === category.id) || category;
    setCategoryModifiersModal({ open: true, category: latestCat });
    setNewModName('');
    setNewModPrice('');
    setEditingModId(null);
  };

  const handleAddCategoryModifier = async (e) => {
    e.preventDefault();
    if (!categoryModifiersModal.category) return;
    const name = newModName.trim();
    const priceDelta = Number(newModPrice);
    if (!name) {
      alert('Please enter an add-on name');
      return;
    }
    if (isNaN(priceDelta) || priceDelta < 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      await window.api?.menuAdmin?.createModifier?.(sessionId, {
        categoryId: categoryModifiersModal.category.id,
        name,
        priceDelta,
      });
      showToast(`Added "${name}" to ${categoryModifiersModal.category.name}`);
      setNewModName('');
      setNewModPrice('');
      await loadData();
    } catch (err) {
      alert('Error adding add-on: ' + err.message);
    }
  };

  const handleSaveEditCategoryModifier = async (modId) => {
    const name = editModName.trim();
    const priceDelta = Number(editModPrice);
    if (!name) {
      alert('Please enter an add-on name');
      return;
    }
    if (isNaN(priceDelta) || priceDelta < 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      await window.api?.menuAdmin?.updateModifier?.(sessionId, {
        id: modId,
        name,
        priceDelta,
      });
      showToast(`Updated add-on "${name}"`);
      setEditingModId(null);
      await loadData();
    } catch (err) {
      alert('Error updating add-on: ' + err.message);
    }
  };

  const handleDeleteCategoryModifier = async (modId, modName) => {
    if (!confirm(`Are you sure you want to delete add-on "${modName}"?`)) {
      return;
    }
    try {
      await window.api?.menuAdmin?.deleteModifier?.(sessionId, modId);
      showToast(`Deleted add-on "${modName}"`);
      if (editingModId === modId) setEditingModId(null);
      await loadData();
    } catch (err) {
      alert('Error deleting add-on: ' + err.message);
    }
  };

  const handleClearAllCategoryModifiers = async () => {
    if (!categoryModifiersModal.category) return;
    const cat = catalog.find(c => c.id === categoryModifiersModal.category.id) || categoryModifiersModal.category;
    const count = (cat.modifiers || []).length;
    if (count === 0) return;

    if (!confirm(`Are you sure you want to delete all ${count} add-ons for "${cat.name}"?`)) {
      return;
    }

    try {
      if (window.api?.menuAdmin?.clearCategoryModifiers) {
        await window.api.menuAdmin.clearCategoryModifiers(sessionId, cat.id);
      } else {
        for (const m of (cat.modifiers || [])) {
          await window.api?.menuAdmin?.deleteModifier?.(sessionId, m.id ?? m.modifier_id);
        }
      }
      showToast(`Cleared all add-ons for ${cat.name}`);
      setEditingModId(null);
      await loadData();
    } catch (err) {
      alert('Error clearing add-ons: ' + err.message);
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
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <UtensilsCrossed size={22} color="var(--brand-red)" />
            Menu & Recipes
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Manage categories, products, sizes, prices, and category-wide add-ons
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {toastMessage && (
            <span style={{
              backgroundColor: 'var(--brand-green-light)',
              color: 'var(--brand-green)',
              padding: '6px 14px',
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
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setCategoryModal({ open: true, data: null })}
          >
            <FolderPlus size={16} color="var(--brand-gold)" />
            + New Category
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
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
        gap: '8px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}>
        {catalog.map(cat => {
          const isActive = cat.id === selectedCategoryId;
          return (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                style={{
                  padding: '14px 10px',
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
                title="Rename Category"
              >
                <Edit2 size={13} />
              </button>

              <button
                type="button"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-faint)' }}
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                title="Delete Category"
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-red)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Category Toolbar: Direct Category Add-ons Access */}
      {selectedCategory && (
        <div style={{
          backgroundColor: '#fbfbfb',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {selectedCategory.name}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ({selectedCategory.products.length} product{selectedCategory.products.length === 1 ? '' : 's'})
            </span>

            {/* Category Add-ons Quick Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              {(selectedCategory.modifiers || []).slice(0, 3).map(m => (
                <span
                  key={m.id ?? m.modifier_id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {m.name} <strong style={{ color: 'var(--brand-red)' }}>+₱{Number(m.price_delta).toFixed(2)}</strong>
                </span>
              ))}
              {(selectedCategory.modifiers || []).length > 3 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  +{selectedCategory.modifiers.length - 3} more
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: (selectedCategory.modifiers?.length > 0) ? 'var(--brand-gold)' : 'var(--border-subtle)',
                backgroundColor: (selectedCategory.modifiers?.length > 0) ? '#fffdf7' : '#ffffff',
              }}
              onClick={() => handleOpenCategoryModifiers(selectedCategory)}
            >
              <Sparkles size={14} color="var(--brand-gold)" />
              Category Add-ons ({selectedCategory.modifiers?.length || 0})
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => setProductModal({ open: true, data: null, categoryId: selectedCategoryId })}
            >
              <Plus size={14} color="var(--brand-green)" />
              + Add Product
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Direct & Simple Product Cards */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Loading menu items...
          </div>
        ) : !selectedCategory || selectedCategory.products.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '40px auto',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Package size={40} color="var(--brand-gold)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
              No Products in this Category
            </h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setProductModal({ open: true, data: null, categoryId: selectedCategoryId })}
            >
              <Plus size={15} />
              Add First Product
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', maxWidth: '1400px', margin: '0 auto' }}>
            {selectedCategory.products.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Product Card Header */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Package size={17} color="var(--brand-red)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}
                      onClick={() => setProductModal({ open: true, data: product, categoryId: selectedCategoryId })}
                      title="Edit Product"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--brand-red)' }}
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.74rem', marginLeft: '2px' }}
                      onClick={() => setVariantModal({ open: true, data: null, productId: product.id })}
                    >
                      <Plus size={12} color="var(--brand-green)" />
                      Size
                    </button>
                  </div>
                </div>

                {/* Direct Sizes & Prices List */}
                <div style={{ padding: '8px 16px', flex: 1 }}>
                  {product.variants.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No sizes added yet. Click <strong>+ Size</strong> above.
                    </div>
                  ) : (
                    product.variants.map((variant) => {
                      const ingredientCount = recipeCoverageMap[variant.id] || 0;
                      return (
                        <div
                          key={variant.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--border-subtle)',
                            gap: '8px',
                          }}
                        >
                          {/* Label & Price */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', minWidth: '70px' }}>
                              {variant.label}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-red)', fontSize: '0.92rem' }}>
                              ₱{Number(variant.price).toFixed(2)}
                            </span>
                          </div>

                          {/* Quick Recipe & Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.74rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: ingredientCount > 0 ? '#f0fdf4' : 'var(--bg-surface-elevated)',
                                borderColor: ingredientCount > 0 ? '#bbf7d0' : 'var(--border-subtle)',
                                color: ingredientCount > 0 ? 'var(--brand-green)' : 'var(--text-secondary)',
                                fontWeight: ingredientCount > 0 ? 700 : 500,
                              }}
                              onClick={() => handleOpenRecipe(product, variant)}
                              title={ingredientCount > 0 ? `${ingredientCount} ingredients deducted per sale` : 'Set recipe ingredients'}
                            >
                              <Layers size={12} color={ingredientCount > 0 ? 'var(--brand-green)' : 'var(--brand-gold)'} />
                              {ingredientCount > 0 ? `Recipe (${ingredientCount})` : 'Set Recipe'}
                            </button>

                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}
                              onClick={() => setVariantModal({ open: true, data: variant, productId: product.id })}
                              title="Edit Price & Size"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--brand-red)' }}
                              onClick={() => handleDeleteVariant(variant.id)}
                              title="Delete Size"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category-Level Add-ons Modal */}
      {categoryModifiersModal.open && categoryModifiersModal.category && (() => {
        const cat = catalog.find(c => c.id === categoryModifiersModal.category.id) || categoryModifiersModal.category;
        const currentMods = cat.modifiers || [];

        return (
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--brand-gold)" />
                    Add-ons for Category: {cat.name}
                  </h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Customers ordering any item in <strong>{cat.name}</strong> will be offered these add-ons.
                  </p>
                </div>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-muted)' }}
                  onClick={() => setCategoryModifiersModal({ open: false, category: null })}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Add New Add-on to Category */}
                <form
                  onSubmit={handleAddCategoryModifier}
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    + Add New Add-on to {cat.name}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add-on Name (e.g. Extra Mayo)"
                      value={newModName}
                      onChange={(e) => setNewModName(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Price ₱"
                      value={newModPrice}
                      onChange={(e) => setNewModPrice(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.84rem',
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>
                </form>

                {/* Add-ons List */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Current Add-ons ({currentMods.length})
                    </span>
                    {currentMods.length > 0 && (
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-red)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={handleClearAllCategoryModifiers}
                      >
                        <Trash2 size={12} />
                        Clear All
                      </button>
                    )}
                  </div>

                  {currentMods.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px 16px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      border: '1px dashed var(--border-light)',
                    }}>
                      No add-ons in <strong>{cat.name}</strong> yet. Use the form above to add one.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <tbody>
                          {currentMods.map(mod => {
                            const modId = mod.id ?? mod.modifier_id;
                            const isEditing = editingModId === modId;

                            if (isEditing) {
                              return (
                                <tr key={modId} style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '6px 12px' }}>
                                    <input
                                      type="text"
                                      value={editModName}
                                      onChange={(e) => setEditModName(e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '5px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-light)',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                      }}
                                      autoFocus
                                    />
                                  </td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      value={editModPrice}
                                      onChange={(e) => setEditModPrice(e.target.value)}
                                      style={{
                                        width: '80px',
                                        padding: '5px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-light)',
                                        fontSize: '0.82rem',
                                        fontFamily: 'var(--font-mono)',
                                        textAlign: 'right',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      style={{ padding: '3px 8px', fontSize: '0.74rem', marginRight: '4px' }}
                                      onClick={() => handleSaveEditCategoryModifier(modId)}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                      onClick={() => setEditingModId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={modId} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#ffffff' }}>
                                <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text-main)' }}>
                                  {mod.name}
                                </td>
                                <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-red)' }}>
                                  +₱{Number(mod.price_delta || 0).toFixed(2)}
                                </td>
                                <td style={{ padding: '9px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button
                                    type="button"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', marginRight: '6px' }}
                                    onClick={() => {
                                      setEditingModId(modId);
                                      setEditModName(mod.name);
                                      setEditModPrice(String(mod.price_delta));
                                    }}
                                    title="Edit Add-on"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--brand-red)' }}
                                    onClick={() => handleDeleteCategoryModifier(modId, mod.name)}
                                    title="Delete Add-on"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '7px 20px', fontSize: '0.84rem' }}
                  onClick={() => {
                    setCategoryModifiersModal({ open: false, category: null });
                    setEditingModId(null);
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Recipe Modal */}
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
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Layers size={18} color="var(--brand-red)" />
                  Recipe for {recipeModal.productName}
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: 'var(--brand-red)', fontWeight: 700 }}>
                  Size: {recipeModal.variant?.label}
                </p>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-muted)' }}
                onClick={() => setRecipeModal({ open: false, variant: null, productName: '', ingredients: [] })}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Info size={16} color="var(--brand-gold)" style={{ flexShrink: 0 }} />
              <div>
                Ingredients deducted from store inventory every time this size is ordered.
              </div>
            </div>

            {/* Ingredient Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recipeModal.ingredients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No ingredients configured yet. Click <strong>+ Add Ingredient</strong> below.
                </div>
              ) : (
                recipeModal.ingredients.map((ing, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 36px', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={ing.inventoryItemId}
                      onChange={(e) => handleUpdateRecipeIngredient(idx, 'inventoryItemId', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        backgroundColor: '#ffffff',
                        fontSize: '0.85rem',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={ing.qtyPerUnit}
                        onChange={(e) => handleUpdateRecipeIngredient(idx, 'qtyPerUnit', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-light)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          textAlign: 'right',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '32px' }}>
                        {ing.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--brand-red)' }}
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
                style={{ alignSelf: 'flex-start', marginTop: '4px', padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={handleAddRecipeIngredient}
              >
                <Plus size={14} color="var(--brand-green)" />
                + Add Ingredient
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                onClick={() => setRecipeModal({ open: false, variant: null, productName: '', ingredients: [] })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                onClick={handleSaveRecipe}
              >
                <Save size={15} />
                Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal (Create / Rename) */}
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
            maxWidth: '380px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {categoryModal.data ? 'Rename Category' : 'New Category'}
              </h2>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                onClick={() => setCategoryModal({ open: false, data: null })}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Category Name
                </label>
                <input
                  name="categoryName"
                  defaultValue={categoryModal.data?.name || ''}
                  required
                  autoFocus
                  placeholder="e.g. Desserts"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '6px' }}>
                {categoryModal.data ? (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: 'var(--brand-red)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => handleDeleteCategory(categoryModal.data.id, categoryModal.data.name)}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    onClick={() => setCategoryModal({ open: false, data: null })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal (Create / Rename) */}
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
            maxWidth: '400px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {productModal.data ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                onClick={() => setProductModal({ open: false, data: null, categoryId: null })}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Product Name
                </label>
                <input
                  name="productName"
                  defaultValue={productModal.data?.name || ''}
                  required
                  autoFocus
                  placeholder="e.g. Cheesy Bacon Takoyaki"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select
                  name="productCategory"
                  defaultValue={productModal.data?.category_id || productModal.categoryId || selectedCategoryId}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  {catalog.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '6px' }}>
                {productModal.data ? (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: 'var(--brand-red)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => handleDeleteProduct(productModal.data.id, productModal.data.name)}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    onClick={() => setProductModal({ open: false, data: null, categoryId: null })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variant Modal (Size & Price) */}
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
            maxWidth: '380px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {variantModal.data ? 'Edit Size & Price' : 'Add Size / Variant'}
            </h2>

            <form onSubmit={handleSaveVariant} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Size Label
                </label>
                <input
                  name="variantLabel"
                  defaultValue={variantModal.data?.label || ''}
                  required
                  autoFocus
                  placeholder="e.g. 4 pcs, 8 pcs, 16oz"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Selling Price (₱)
                </label>
                <input
                  name="variantPrice"
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={variantModal.data?.price || ''}
                  required
                  placeholder="50.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
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
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Unit Ingredient Cost (₱, optional)
                </label>
                <input
                  name="variantCost"
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={variantModal.data?.cost || '0'}
                  placeholder="20.00"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                  onClick={() => setVariantModal({ open: false, data: null, productId: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
