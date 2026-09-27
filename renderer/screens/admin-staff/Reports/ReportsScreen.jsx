// renderer/screens/admin-staff/Reports/ReportsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  AlertOctagon,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

function getLocalDateString(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const safeNumber = (val, fallback = 0) => {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

export function ReportsScreen() {
  const { sessionId } = useAuth();
  const [reportType, setReportType] = useState('daily_sales'); // 'daily_sales', 'shift_summary', 'product_mix', 'inventory'
  const [startDate, setStartDate] = useState(() => getLocalDateString());
  const [endDate, setEndDate] = useState(() => getLocalDateString());
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setReportData(null);

    const fetchReport = async () => {
      try {
        let res = null;
        if (reportType === 'daily_sales') {
          res = await window.api?.reports?.getDailySales?.(sessionId, startDate);
        } else if (reportType === 'shift_summary') {
          res = await window.api?.reports?.getShiftSummary?.(sessionId, 1);
        } else if (reportType === 'product_mix') {
          res = await window.api?.reports?.getProductMix?.(sessionId, startDate, endDate);
        } else if (reportType === 'inventory') {
          res = await window.api?.reports?.getInventory?.(sessionId, startDate, endDate);
        }

        if (!isCancelled) {
          if (res?.success && res.data) {
            setReportData({ ...res.data, _reportType: reportType });
          } else {
            setReportData(null);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load report:', err);
          setReportData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isCancelled = true;
    };
  }, [reportType, startDate, endDate, sessionId]);

  const handleTabChange = (newType) => {
    if (newType === reportType) return;
    setReportData(null);
    setLoading(true);
    setReportType(newType);
  };

  const handleExportCsv = async () => {
    if (!reportData || reportData._reportType !== reportType) return;
    try {
      let csvContent = '';
      if (window.api?.reports?.exportCsv) {
        const res = await window.api.reports.exportCsv(sessionId, reportType, reportData);
        csvContent = res?.data || '';
      }

      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `takotime_${reportType}_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      alert('CSV Export failed: ' + err.message);
    }
  };

  const setPreset = (preset) => {
    const now = new Date();
    const today = getLocalDateString(now);
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = getLocalDateString(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setStartDate(getLocalDateString(d));
      setEndDate(today);
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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BarChart3 size={22} color="var(--brand-green)" />
              Store Reports & Analytics
            </h1>
          </div>

          {/* Date Range Selectors */}
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
              <Calendar size={15} color="var(--text-muted)" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', outline: 'none' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={() => setPreset('today')}>
                Today
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={() => setPreset('yesterday')}>
                Yesterday
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={() => setPreset('last7')}>
                7 Days
              </button>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {downloadSuccess && (
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
              CSV Downloaded!
            </span>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
            onClick={handleExportCsv}
          >
            <Download size={16} />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        display: 'flex',
        gap: '24px',
      }}>
        {[
          { id: 'daily_sales', label: 'Daily Sales Summary' },
          { id: 'shift_summary', label: 'Shift Cash Accountability' },
          { id: 'product_mix', label: 'Product Mix (Popular Items)' },
          { id: 'inventory', label: 'Inventory & Waste Ledger' },
        ].map((tab) => {
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              style={{
                padding: '14px 4px',
                border: 'none',
                background: 'transparent',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9rem',
                color: isActive ? 'var(--brand-red)' : 'var(--text-muted)',
                borderBottom: isActive ? '3px solid var(--brand-red)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {loading || !reportData || reportData._reportType !== reportType ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            {loading ? 'Loading report data...' : 'No report data found for this selection.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* 1. Daily Sales Tab */}
            {reportType === 'daily_sales' && reportData._reportType === 'daily_sales' && (
              <>
                {/* Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Revenue</span>
                      <DollarSign size={18} color="var(--brand-green)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                      ₱{safeNumber(reportData.summary?.netSales).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Gross: ₱{safeNumber(reportData.summary?.grossSales).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cash Sales</span>
                      <DollarSign size={18} color="var(--brand-red)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      ₱{safeNumber(reportData.summary?.cashSales).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Collected in register drawer
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>GCash Digital</span>
                      <CreditCard size={18} color="#2563eb" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                      ₱{safeNumber(reportData.summary?.gcashSales).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Confirmed with GCash Ref #
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders Served</span>
                      <ShoppingBag size={18} color="var(--brand-gold)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      {safeNumber(reportData.summary?.completedOrders)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: safeNumber(reportData.summary?.voidedOrders) > 0 ? 'var(--brand-danger)' : 'var(--text-muted)', marginTop: '4px' }}>
                      {safeNumber(reportData.summary?.voidedOrders)} voided orders
                    </div>
                  </div>
                </div>

                {/* Top Selling Items Table */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
                    Top Selling Menu Items
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 14px' }}>Product</th>
                        <th style={{ padding: '10px 14px' }}>Variant</th>
                        <th style={{ padding: '10px 14px' }}>Category</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Units Sold</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.topItems || []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{item.product_name || '—'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{item.variant_label || '—'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{item.category_name || '—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{safeNumber(item.units_sold)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-red)' }}>
                            ₱{safeNumber(item.total_revenue).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 2. Shift Summary Tab */}
            {reportType === 'shift_summary' && reportData._reportType === 'shift_summary' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
                  Shift Cash Accountability (#1)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Starting Drawer Cash</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      ₱{safeNumber(reportData.cashAccounting?.startingCash).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cash Received from Sales</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                      +₱{safeNumber(reportData.cashAccounting?.cashSales).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Expected Drawer Balance</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>
                      ₱{safeNumber(reportData.cashAccounting?.expectedDrawerCash).toFixed(2)}
                    </div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Shift Cashier</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{reportData.shift?.staffName || 'Staff'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--brand-green)', textTransform: 'uppercase' }}>{reportData.shift?.status || 'Active'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Petty Cash In / Drops</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>₱{safeNumber(reportData.cashAccounting?.cashIn).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Petty Cash Out / Expenses</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--brand-danger)' }}>-₱{safeNumber(reportData.cashAccounting?.cashOut).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Ending Counted Cash</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        {typeof reportData.cashAccounting?.countedDrawerCash === 'number'
                          ? `₱${safeNumber(reportData.cashAccounting.countedDrawerCash).toFixed(2)}`
                          : 'Shift in progress (not closed)'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Discrepancy (Overage / Shortage)</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        {typeof reportData.cashAccounting?.discrepancy === 'number' ? (
                          <span style={{ color: reportData.cashAccounting.discrepancy === 0 ? 'var(--brand-green)' : 'var(--brand-danger)' }}>
                            ₱{safeNumber(reportData.cashAccounting.discrepancy).toFixed(2)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Product Mix Tab */}
            {reportType === 'product_mix' && reportData._reportType === 'product_mix' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Product Revenue & Volume Share
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Total Units Sold: <strong>{safeNumber(reportData.totalUnits)}</strong> • Total Revenue: <strong>₱{safeNumber(reportData.totalRevenue).toFixed(2)}</strong>
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>Product</th>
                      <th style={{ padding: '12px 14px' }}>Variant</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Units Sold</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Revenue</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>% Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{item.category_name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{item.product_name || '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{item.variant_label || '—'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₱{safeNumber(item.unit_price).toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{safeNumber(item.units_sold)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-red)' }}>
                          ₱{safeNumber(item.total_revenue).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {safeNumber(item.percentOfRevenue).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Inventory Tab */}
            {reportType === 'inventory' && reportData._reportType === 'inventory' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
                  Ingredient Consumption & Waste Signal
                </h3>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 14px' }}>Item</th>
                      <th style={{ padding: '12px 14px' }}>Unit</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Stock In</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Recipe Usage</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Confirmed Usage</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Net Shrinkage / Waste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.items || []).map((item, idx) => {
                      const stockIn = safeNumber(item.total_stock_in);
                      const suggested = safeNumber(item.total_suggested_out);
                      const confirmed = safeNumber(item.total_confirmed_out);
                      const waste = item.total_waste_qty !== null && item.total_waste_qty !== undefined ? safeNumber(item.total_waste_qty) : 0;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{item.item_name || 'Item'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.unit || 'units'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                            +{stockIn.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            {suggested.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {confirmed.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                            {waste > 0.0001 ? (
                              <span style={{ color: 'var(--brand-gold)' }}>+{waste.toFixed(2)} (Waste)</span>
                            ) : waste < -0.0001 ? (
                              <span style={{ color: '#2563eb' }}>{waste.toFixed(2)} (Surplus)</span>
                            ) : (
                              <span style={{ color: 'var(--brand-green)' }}>0.00</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
