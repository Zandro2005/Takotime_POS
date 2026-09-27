// renderer/screens/admin/Dashboard/DashboardScreen.jsx
// Executive overview screen with live sales KPIs, 7-day trend visualizer, active drawer accountability, and low-stock alerts.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export function DashboardScreen({ onNavigate }) {
  const { sessionId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      if (window.api?.dashboard?.getOverview) {
        const res = await window.api.dashboard.getOverview(sessionId);
        if (res.success && res.data) {
          setData(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
    const timer = setInterval(() => loadOverview(false), 20000); // live poll every 20s
    return () => clearInterval(timer);
  }, [sessionId]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" style={{ marginRight: '12px' }} />
        <span>Loading executive dashboard...</span>
      </div>
    );
  }

  const today = data?.today || {
    completedOrders: 0,
    voidedOrders: 0,
    grossSales: 0,
    discounts: 0,
    netSales: 0,
    cashSales: 0,
    gcashSales: 0,
  };

  const activeShift = data?.activeShift;
  const lowStockAlerts = data?.lowStockAlerts || [];
  const salesTrend = data?.salesTrend || [];
  const topProducts = data?.topProducts || [];

  // Find max revenue in 7-day trend for chart scaling
  const maxTrendRevenue = Math.max(...salesTrend.map(d => d.revenue), 1000);

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--brand-green-light)',
              color: 'var(--brand-green)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />
              LIVE STORE METRICS
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Branch: Montalban • {data?.date || new Date().toISOString().split('T')[0]}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            Executive Dashboard
          </h1>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadOverview(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px' }}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}>
        {/* Net Sales */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TODAY'S NET SALES
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--brand-green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)',
            }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', lineHeight: 1 }}>
              ₱{today.netSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '12px' }}>
              <span>Cash: <strong>₱{today.cashSales.toFixed(2)}</strong></span>
              <span>•</span>
              <span>GCash: <strong>₱{today.gcashSales.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              COMPLETED ORDERS
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', lineHeight: 1 }}>
              {today.completedOrders}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {today.voidedOrders > 0 ? (
                <span style={{ color: 'var(--brand-red)', fontWeight: 600 }}>{today.voidedOrders} voided order(s)</span>
              ) : (
                <span>0 voided orders</span>
              )}
              {today.completedOrders > 0 && (
                <span style={{ marginLeft: '8px' }}>
                  • Avg ticket: <strong>₱{(today.netSales / today.completedOrders).toFixed(2)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Shift Cash Drawer */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              CASH DRAWER ON DUTY
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: activeShift ? 'var(--brand-gold-light)' : 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeShift ? 'var(--brand-gold)' : 'var(--text-muted)',
            }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            {activeShift ? (
              <>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', lineHeight: 1 }}>
                  ₱{activeShift.expectedDrawerCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Expected in drawer • Cashier: <strong>{activeShift.staffName}</strong>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1 }}>
                  No Open Shift
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Shift opens upon first cashier POS login
                </div>
              </>
            )}
          </div>
        </div>

        {/* Inventory Low Stock Status */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              INVENTORY HEALTH
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: lowStockAlerts.length > 0 ? 'var(--brand-red-light)' : 'var(--brand-green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: lowStockAlerts.length > 0 ? 'var(--brand-red)' : 'var(--brand-green)',
            }}>
              {lowStockAlerts.length > 0 ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            {lowStockAlerts.length > 0 ? (
              <>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-red)', lineHeight: 1 }}>
                  {lowStockAlerts.length} Item{lowStockAlerts.length > 1 ? 's' : ''} Low
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--brand-red)', marginTop: '8px', fontWeight: 600 }}>
                  Immediate stock replenishment needed
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--brand-green)', lineHeight: 1 }}>
                  All Stock Safe
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  No items below reorder thresholds
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Section: 7-Day Trend + Active Shift / Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* 7-Day Sales Trend Chart Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                7-Day Sales Performance
              </h2>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Peak: ₱{maxTrendRevenue.toLocaleString()}
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '220px', padding: '16px 8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {salesTrend.map((day, idx) => {
              const heightPct = Math.max(12, Math.round((day.revenue / maxTrendRevenue) * 100));
              const isToday = idx === salesTrend.length - 1;
              return (
                <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  {/* Tooltip / value */}
                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: isToday ? 'var(--brand-red)' : 'var(--text-muted)',
                    marginBottom: '6px',
                  }}>
                    ₱{Math.round(day.revenue)}
                  </span>
                  
                  {/* Bar */}
                  <div style={{
                    width: '100%',
                    maxWidth: '44px',
                    height: `${heightPct}%`,
                    backgroundColor: isToday ? 'var(--brand-red)' : '#fca5a5',
                    borderRadius: '6px 6px 0 0',
                    transition: 'all 0.3s ease',
                    boxShadow: isToday ? '0 4px 12px rgba(224, 26, 34, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: '6px',
                  }}>
                    <span style={{ fontSize: '0.68rem', color: isToday ? '#ffffff' : '#7f1d1d', fontWeight: 700 }}>
                      {day.orderCount}
                    </span>
                  </div>

                  {/* Date label */}
                  <span style={{
                    fontSize: '0.75rem',
                    color: isToday ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: isToday ? 800 : 500,
                    marginTop: '10px',
                    textAlign: 'center',
                  }}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--brand-red)', borderRadius: '2px' }} />
                Today's Live Sales
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#fca5a5', borderRadius: '2px' }} />
                Past Days
              </span>
            </div>
            <span>Numbers shown inside bars denote order counts</span>
          </div>
        </div>

        {/* Right Card: Active Shift Details / Low Stock Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Shift Details */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--brand-gold)" />
              Active Shift Ledger
            </h2>

            {activeShift ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cashier On Duty:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{activeShift.staffName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Opened At:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Opening Float:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>₱{activeShift.startingCash.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cash Collected:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>+₱{activeShift.cashSales.toFixed(2)}</strong>
                </div>
                {activeShift.cashOut > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cash Paid Out:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>-₱{activeShift.cashOut.toFixed(2)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Expected Drawer:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', fontSize: '1.1rem' }}>
                    ₱{activeShift.expectedDrawerCash.toFixed(2)}
                  </strong>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active cashier shift currently open.
              </p>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            flex: 1,
          }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--brand-red)" />
              Stock Threshold Alerts
            </h2>

            {lowStockAlerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lowStockAlerts.map(item => (
                  <div key={item.itemId} style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: item.severity === 'critical' ? 'var(--brand-red-light)' : 'var(--brand-gold-light)',
                    border: `1px solid ${item.severity === 'critical' ? 'rgba(224, 26, 34, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: item.severity === 'critical' ? 'var(--brand-red)' : 'var(--brand-gold)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Current: <strong>{item.currentStock} {item.unit}</strong> (Min: {item.minStock} {item.unit})
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: item.severity === 'critical' ? 'var(--brand-red)' : 'var(--brand-gold)',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                    }}>
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="var(--brand-green)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Stock Levels Healthy</div>
                <div style={{ fontSize: '0.75rem' }}>All materials are above safety thresholds</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Products Sold Today */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Today's Best Selling Items
        </h2>

        {topProducts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '10px 14px' }}>PRODUCT</th>
                  <th style={{ padding: '10px 14px' }}>PORTION / SIZE</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>UNITS SOLD</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>TOTAL REVENUE</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {p.product_name}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                      <span className="badge badge-secondary">{p.variant_label}</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {p.units_sold}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                      ₱{Number(p.total_revenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>
            No sales recorded today yet.
          </p>
        )}
      </div>
    </div>
  );
}
