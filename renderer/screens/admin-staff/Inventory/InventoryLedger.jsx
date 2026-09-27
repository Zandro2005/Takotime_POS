// renderer/screens/admin-staff/Inventory/InventoryLedger.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  ClipboardList,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  Save,
  Info
} from 'lucide-react';

function getLocalDateString(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const formatQty = (val, decimals = 2) => {
  if (val === null || val === undefined || val === '') return '0.00';
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

export function InventoryLedger() {
  const { sessionId } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCounts, setEditingCounts] = useState({});
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [stockInQty, setStockInQty] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadLedger = async (date = selectedDate) => {
    setLoading(true);
    setError(null);
    try {
      if (window.api?.inventory?.getItems) {
        const res = await window.api.inventory.getItems(sessionId, date);
        if (res && res.success && Array.isArray(res.data)) {
          setItems(res.data);
          // Initialize editable confirmed counts from data
          const initial = {};
          res.data.forEach(item => {
            if (item && item.itemId !== undefined) {
              initial[item.itemId] = (item.confirmedOut !== null && item.confirmedOut !== undefined) ? String(item.confirmedOut) : '';
            }
          });
          setEditingCounts(initial);
        } else if (res && !res.success) {
          setError(res.error || 'Failed to load inventory items');
          setItems([]);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load inventory items:', err);
      setError(err.message || 'Failed to load inventory items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger(selectedDate);
  }, [selectedDate, sessionId]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleCountChange = (itemId, val) => {
    setEditingCounts(prev => ({
      ...prev,
      [itemId]: val,
    }));
  };

  const handleConfirmSingle = async (item) => {
    const rawVal = editingCounts[item.itemId];
    const qty = rawVal === '' || rawVal === undefined ? (Number(item.suggestedOut) || 0) : Number(rawVal);

    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid non-negative number');
      return;
    }

    try {
      if (window.api?.inventory?.confirmOut) {
        const res = await window.api.inventory.confirmOut(sessionId, {
          itemId: item.itemId,
          date: selectedDate,
          confirmedQty: qty,
        });
        if (res && res.success === false) {
          throw new Error(res.error || 'Failed to save count');
        }
        await loadLedger(selectedDate);
        setSaveSuccessMsg(`Saved count for ${item.name}`);
        setTimeout(() => setSaveSuccessMsg(''), 2500);
      }
    } catch (err) {
      alert('Failed to save count: ' + err.message);
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const item of items) {
        const rawVal = editingCounts[item.itemId];
        if (rawVal !== '' && rawVal !== undefined) {
          const qty = Number(rawVal);
          if (!isNaN(qty) && qty >= 0) {
            await window.api?.inventory?.confirmOut?.(sessionId, {
              itemId: item.itemId,
              date: selectedDate,
              confirmedQty: qty,
            });
          }
        }
      }
      await loadLedger(selectedDate);
      setSaveSuccessMsg('All physical counts confirmed and saved!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to save counts: ' + err.message);
    }
  };

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStockItem || !stockInQty || isNaN(Number(stockInQty)) || Number(stockInQty) <= 0) {
      alert('Please select an item and enter a valid quantity');
      return;
    }

    try {
      if (window.api?.inventory?.updateLog) {
        const res = await window.api.inventory.updateLog(sessionId, {
          itemId: selectedStockItem.itemId,
          date: selectedDate,
          stockIn: Number(stockInQty),
        });
        if (res && res.success === false) {
          throw new Error(res.error || 'Failed to record stock in');
        }
        setShowStockInModal(false);
        setStockInQty('');
        setSelectedStockItem(null);
        await loadLedger(selectedDate);
        setSaveSuccessMsg(`Added +${stockInQty} ${selectedStockItem.unit} to ${selectedStockItem.name}`);
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert('Failed to record stock in: ' + err.message);
    }
  };

  const safeItems = Array.isArray(items) ? items : [];
  const lowStockCount = safeItems.filter(i => Boolean(i?.isLowStock)).length;
  const unconfirmedCount = safeItems.filter(i => !Boolean(i?.isConfirmed)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Header Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ClipboardList size={22} color="var(--brand-red)" />
              Daily Inventory Ledger
            </h1>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
            }}>
              <Calendar size={16} color="var(--text-muted)" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.8rem' }}
              onClick={() => setSelectedDate(getLocalDateString())}
            >
              Today
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '7px 10px' }}
              onClick={() => loadLedger(selectedDate)}
              title="Refresh ledger"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {saveSuccessMsg && (
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
              {saveSuccessMsg}
            </span>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 14px' }}
            onClick={() => {
              if (safeItems.length > 0) setSelectedStockItem(safeItems[0]);
              setShowStockInModal(true);
            }}
          >
            <PackagePlus size={16} color="var(--brand-gold)" />
            + Record Delivery
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
            onClick={handleSaveAll}
            disabled={safeItems.length === 0}
          >
            <Save size={16} />
            Confirm All Counts
          </button>
        </div>
      </div>

      {/* Error alert banner if fetch failed */}
      {error && (
        <div style={{
          margin: '16px 24px 0 24px',
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-danger)', fontSize: '0.88rem', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            onClick={() => loadLedger(selectedDate)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div style={{ padding: '16px 24px 0 24px', display: 'flex', gap: '12px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tracked Items</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{safeItems.length}</span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unconfirmed Items</span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: unconfirmedCount > 0 ? 'var(--brand-gold)' : 'var(--brand-green)',
          }}>
            {unconfirmedCount}
          </span>
        </div>

        {lowStockCount > 0 && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <AlertTriangle size={16} color="var(--brand-gold)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e' }}>
              {lowStockCount} ingredient{lowStockCount > 1 ? 's' : ''} below minimum stock threshold
            </span>
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div style={{ flex: 1, padding: '16px 24px 24px 24px', overflowY: 'auto' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ingredient Name
                </th>
                <th style={{ padding: '14px 14px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Unit
                </th>
                <th style={{ padding: '14px 14px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                  Beginning
                </th>
                <th style={{ padding: '14px 14px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                  Stock In
                </th>
                <th style={{ padding: '14px 14px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                  Recipe Out
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', minWidth: '150px' }}>
                  Confirmed Count
                </th>
                <th style={{ padding: '14px 14px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                  Ending Qty
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                  Shrinkage / Waste
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading daily ledger...
                  </td>
                </tr>
              ) : safeItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No inventory records found for this date.
                  </td>
                </tr>
              ) : (
                safeItems.map((item) => {
                  const beginningNum = Number(item.beginningQty) || 0;
                  const stockInNum = Number(item.stockIn) || 0;
                  const suggestedOutNum = Number(item.suggestedOut) || 0;
                  const endingNum = item.endingQty !== null && item.endingQty !== undefined ? Number(item.endingQty) : null;
                  const wasteNum = item.wasteQty !== null && item.wasteQty !== undefined && item.wasteQty !== '' ? Number(item.wasteQty) : null;

                  const hasWaste = wasteNum !== null && !isNaN(wasteNum) && wasteNum > 0.0001;
                  const isBalanced = wasteNum !== null && !isNaN(wasteNum) && Math.abs(wasteNum) <= 0.0001;
                  const hasSurplus = wasteNum !== null && !isNaN(wasteNum) && wasteNum < -0.0001;

                  return (
                    <tr
                      key={item.itemId}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: item.isLowStock ? 'rgba(254, 242, 242, 0.4)' : '#ffffff',
                      }}
                    >
                      {/* Name */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.name || 'Unnamed Item'}
                          {item.isLowStock && (
                            <span style={{
                              fontSize: '0.7rem',
                              backgroundColor: 'rgba(220, 38, 38, 0.1)',
                              color: 'var(--brand-danger)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-xs)',
                              fontWeight: 700,
                            }}>
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td style={{ padding: '14px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {item.unit || 'units'}
                      </td>

                      {/* Beginning */}
                      <td style={{ padding: '14px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {formatQty(beginningNum)}
                      </td>

                      {/* Stock In */}
                      <td style={{ padding: '14px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: stockInNum > 0 ? 'var(--brand-green)' : 'var(--text-muted)' }}>
                        {stockInNum > 0 ? `+${formatQty(stockInNum)}` : '0.00'}
                      </td>

                      {/* Recipe Suggested Out */}
                      <td style={{ padding: '14px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-red)' }}>
                        {suggestedOutNum > 0 ? `-${formatQty(suggestedOutNum)}` : '0.00'}
                      </td>

                      {/* Confirmed Out Input */}
                      <td style={{ padding: '10px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder={formatQty(suggestedOutNum)}
                            value={editingCounts[item.itemId] ?? ''}
                            onChange={(e) => handleCountChange(item.itemId, e.target.value)}
                            style={{
                              width: '100px',
                              padding: '8px 10px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              textAlign: 'right',
                              borderRadius: 'var(--radius-md)',
                              border: item.isConfirmed ? '1px solid var(--border-light)' : '1px solid var(--brand-gold)',
                              backgroundColor: item.isConfirmed ? '#ffffff' : '#fffbeb',
                              color: 'var(--text-main)',
                              outline: 'none',
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
                            title="Auto-fill with recipe suggested quantity"
                            onClick={() => handleCountChange(item.itemId, formatQty(suggestedOutNum))}
                          >
                            <Info size={14} color="var(--text-muted)" />
                          </button>
                        </div>
                      </td>

                      {/* Ending Qty */}
                      <td style={{ padding: '14px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-main)' }}>
                        {endingNum !== null && !isNaN(endingNum) ? formatQty(endingNum) : '—'}
                      </td>

                      {/* Shrinkage / Waste signal */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {hasWaste ? (
                          <span style={{
                            backgroundColor: 'rgba(217, 119, 6, 0.1)',
                            color: 'var(--brand-gold)',
                            border: '1px solid rgba(217, 119, 6, 0.3)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                          }}>
                            +{formatQty(wasteNum)} {item.unit || ''} (Shrinkage)
                          </span>
                        ) : hasSurplus ? (
                          <span style={{
                            backgroundColor: 'rgba(37, 99, 235, 0.08)',
                            color: '#1d4ed8',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {formatQty(wasteNum)} {item.unit || ''} (Surplus)
                          </span>
                        ) : isBalanced ? (
                          <span style={{
                            backgroundColor: 'var(--brand-green-light)',
                            color: 'var(--brand-green)',
                            border: '1px solid rgba(5, 150, 105, 0.25)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}>
                            ✓ Balanced
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>Unconfirmed</span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`btn ${item.isConfirmed ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => handleConfirmSingle(item)}
                        >
                          {item.isConfirmed ? 'Update' : 'Confirm'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Stock In Modal */}
      {showStockInModal && (
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
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackagePlus size={22} color="var(--brand-gold)" />
              Record Delivery (Stock In)
            </h2>

            <form onSubmit={handleStockInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Select Ingredient
                </label>
                <select
                  value={selectedStockItem?.itemId || ''}
                  onChange={(e) => {
                    const found = safeItems.find(i => i.itemId === Number(e.target.value));
                    setSelectedStockItem(found || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: '#ffffff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                >
                  {safeItems.map(it => (
                    <option key={it.itemId} value={it.itemId}>
                      {it.name || 'Unnamed Item'} ({it.unit || 'units'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Delivered Quantity ({selectedStockItem?.unit || 'units'})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  autoFocus
                  placeholder="e.g. 5.0"
                  value={stockInQty}
                  onChange={(e) => setStockInQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => setShowStockInModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Save Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
