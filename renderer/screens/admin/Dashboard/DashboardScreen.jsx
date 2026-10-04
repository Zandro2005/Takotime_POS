// renderer/screens/admin/Dashboard/DashboardScreen.jsx
// Executive overview screen with live sales KPIs, 7-day trend visualizer, active drawer accountability, and low-stock alerts.

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Package,
  Layers,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  X
} from 'lucide-react';

const TIMEFRAME_OPTIONS = [
  { id: '7d', label: '7 Days', description: 'Past 7 Days' },
  { id: '15d', label: '15 Days', description: 'Past 15 Days' },
  { id: '30d', label: '30 Days', description: 'Past 30 Days' },
  { id: 'semi_annual', label: 'Semi-Annually', description: 'Past 6 Months' },
  { id: 'annual', label: 'Annually', description: 'Past 12 Months' },
];

export function DashboardScreen({ onNavigate }) {
  const { sessionId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');
  const timeframeRef = useRef('7d');
  timeframeRef.current = timeframe;
  const [customTrend, setCustomTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Swipable Carousel & Windowing States
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [mouseDownX, setMouseDownX] = useState(null);
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadOverview = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      if (window.api?.dashboard?.getOverview) {
        const res = await window.api.dashboard.getOverview(sessionId, undefined, timeframeRef.current);
        if (res.success && res.data) {
          setData(res.data);
          if (res.data.salesTrend && (!res.data.timeframe || res.data.timeframe === timeframeRef.current)) {
            setCustomTrend(res.data.salesTrend);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTimeframeChange = async (newTf) => {
    if (newTf === timeframe) return;
    setTimeframe(newTf);
    timeframeRef.current = newTf;
    setTrendLoading(true);
    try {
      if (window.api?.dashboard?.getSalesTrend) {
        const res = await window.api.dashboard.getSalesTrend(sessionId, newTf);
        if (res?.success && Array.isArray(res.data)) {
          setCustomTrend(res.data);
          return;
        }
      }
      if (window.api?.dashboard?.getOverview) {
        const res = await window.api.dashboard.getOverview(sessionId, undefined, newTf);
        if (res?.success && res.data?.salesTrend) {
          setCustomTrend(res.data.salesTrend);
        }
      }
    } catch (err) {
      console.error('Failed to switch sales trend timeframe:', err);
    } finally {
      setTrendLoading(false);
    }
  };

  const salesTrend = customTrend || data?.salesTrend || [];

  useEffect(() => {
    loadOverview();
    const timer = setInterval(() => loadOverview(false), 20000); // live poll every 20s
    return () => clearInterval(timer);
  }, [sessionId]);

  const getPageSize = (tf) => {
    if (isMobileScreen) {
      if (tf === 'annual') return 4;
      if (tf === 'semi_annual') return 3;
      if (tf === '30d') return 5;
      if (tf === '15d') return 5;
      return 4;
    }
    if (tf === 'annual') return 6;
    if (tf === 'semi_annual') return 6;
    if (tf === '30d') return 8;
    if (tf === '15d') return 8;
    return 7;
  };

  const getChunkLabel = (tf, page, total, slice) => {
    const isLatest = page === total - 1;
    const ps = getPageSize(tf);
    if (tf === '30d' || tf === '15d') {
      const start = page * ps + 1;
      const end = start + (slice?.length || ps) - 1;
      return `Days ${start}–${end}${isLatest ? ' (Latest)' : ''}`;
    }
    if (tf === 'annual') {
      return page === 0 ? 'Months 1–6 (H1)' : 'Months 7–12 (Latest)';
    }
    if (tf === 'semi_annual') {
      return `Slice ${page + 1} of ${total}${isLatest ? ' (Latest)' : ''}`;
    }
    return `Page ${page + 1} of ${total}${isLatest ? ' (Latest)' : ''}`;
  };

  // Auto-jump to the latest page (last slide) when timeframe, trend data, or screen size changes
  useEffect(() => {
    const ps = getPageSize(timeframe);
    const pages = Math.max(1, Math.ceil(salesTrend.length / ps));
    setCurrentPage(pages - 1);
  }, [timeframe, salesTrend.length, isMobileScreen]);

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
  const topProducts = data?.topProducts || [];

  const totalTrendRevenue = salesTrend.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
  const totalTrendOrders = salesTrend.reduce((sum, d) => sum + (Number(d.orderCount ?? d.orders) || 0), 0);
  const avgTrendRevenue = salesTrend.length > 0 ? (totalTrendRevenue / salesTrend.length) : 0;
  const peakTrendItem = salesTrend.reduce((prev, cur) => ((Number(cur.revenue) > (Number(prev?.revenue) || 0)) ? cur : prev), null);
  const maxTrendRevenue = Math.max(...salesTrend.map(d => Number(d.revenue) || 0), 1000);

  // Strictly retain 6-8 bars per view matching the original 7-day scale without expanding the card
  const pageSize = getPageSize(timeframe);
  const totalPages = Math.max(1, Math.ceil(salesTrend.length / pageSize));

  const trendPages = [];
  for (let i = 0; i < salesTrend.length; i += pageSize) {
    trendPages.push(salesTrend.slice(i, i + pageSize));
  }
  if (trendPages.length === 0) {
    trendPages.push([]);
  }
  const currentSlice = trendPages[currentPage] || trendPages[0] || [];

  const handleTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      setTouchStartX(e.targetTouches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      setTouchEndX(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const distance = touchStartX - touchEndX;
      const minSwipeDistance = 40;
      if (distance > minSwipeDistance && currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (distance < -minSwipeDistance && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleMouseDown = (e) => {
    setMouseDownX(e.clientX);
  };

  const handleMouseUp = (e) => {
    if (mouseDownX !== null) {
      const distance = mouseDownX - e.clientX;
      const minSwipeDistance = 45;
      if (distance > minSwipeDistance && currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (distance < -minSwipeDistance && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    }
    setMouseDownX(null);
  };

  const getTimeframeLabel = (tf) => {
    const found = TIMEFRAME_OPTIONS.find(o => o.id === tf);
    return found ? found.label : tf;
  };

  const handleExportExcel = () => {
    if (!salesTrend || salesTrend.length === 0) return;
    const tfTitle = getTimeframeLabel(timeframe);
    const dateStr = data?.date || new Date().toLocaleDateString('en-CA');

    const headers = ['"Period / Date"', '"Orders"', '"Net Sales (PHP)"', '"Sales Contribution %"'];
    const rows = salesTrend.map(d => {
      const rev = Number(d.revenue) || 0;
      const pct = totalTrendRevenue > 0 ? ((rev / totalTrendRevenue) * 100).toFixed(1) + '%' : '0.0%';
      return [
        `"${d.label || d.date}"`,
        d.orderCount ?? d.orders ?? 0,
        rev.toFixed(2),
        `"${pct}"`
      ];
    });

    rows.push([]);
    rows.push(['"TOTAL"', totalTrendOrders, totalTrendRevenue.toFixed(2), '"100.0%"']);
    rows.push(['"AVERAGE"', salesTrend.length > 0 ? (totalTrendOrders / salesTrend.length).toFixed(1) : 0, avgTrendRevenue.toFixed(2), '""']);
    if (peakTrendItem) {
      rows.push(['"PEAK PERIOD"', `"${peakTrendItem.label || peakTrendItem.date}"`, (Number(peakTrendItem.revenue) || 0).toFixed(2), '""']);
    }

    const csvContent = '\uFEFF' + [
      `"TAKO TIME! Montalban Branch - Sales Performance Report"`,
      `"Timeframe: ${tfTitle} (${salesTrend.length} periods)"`,
      `"Generated: ${new Date().toLocaleString()}"`,
      `""`,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `takotime_sales_${timeframe}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="responsive-page-container">
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              Branch: Montalban • {data?.date || new Date().toLocaleDateString('en-CA')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
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
      <div className="grid-kpi-responsive">
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
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', lineHeight: 1 }}>
                ₱{(Number(activeShift.expectedDrawerCash ?? activeShift.expected_cash ?? activeShift.starting_cash ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            ) : (
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1 }}>
                No Open Shift
              </div>
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
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-red)', lineHeight: 1 }}>
                {lowStockAlerts.length} Item{lowStockAlerts.length > 1 ? 's' : ''} Low
              </div>
            ) : (
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--brand-green)', lineHeight: 1 }}>
                All Stock Safe
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Section: Sales Trend Chart + Active Shift / Alerts */}
      <div className="grid-dashboard-main">
        {/* Sales Trend Chart Card with Multi-Timeframe and Export/Print */}
        <div className="chart-card-responsive">
          {/* Card Header with Timeframe Pills and Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--brand-red)" />
                Sales Performance
              </h2>
              <span className="badge badge-secondary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                {getTimeframeLabel(timeframe)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {/* Timeframe Selector Pill Group */}
              <div className="chart-timeframe-pills">
                {TIMEFRAME_OPTIONS.map((opt) => {
                  const isActive = timeframe === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTimeframeChange(opt.id)}
                      disabled={trendLoading}
                      style={{
                        padding: '4px 9px',
                        fontSize: '0.74rem',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? 'var(--brand-red)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: trendLoading ? 'wait' : 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Export Excel and Print / PDF */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="btn btn-secondary"
                  title="Export bar chart data to Microsoft Excel (.csv)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <FileSpreadsheet size={14} color="#16a34a" />
                  {exportSuccess ? 'Exported!' : 'Excel'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="btn btn-secondary"
                  title="Print or Save Sales Report as PDF"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <Printer size={14} color="#2563eb" />
                  Print / PDF
                </button>
              </div>
            </div>
          </div>

          {/* Period Summary Metric Banner */}
          <div className="chart-summary-banner">
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Period Net Revenue
              </span>
              <div style={{ fontSize: isMobileScreen ? '1.0rem' : '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', marginTop: '2px' }}>
                ₱{totalTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Total Orders
              </span>
              <div style={{ fontSize: isMobileScreen ? '1.0rem' : '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '2px' }}>
                {totalTrendOrders}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Avg {['semi_annual', 'annual'].includes(timeframe) ? 'Monthly' : 'Daily'} Sales
              </span>
              <div style={{ fontSize: isMobileScreen ? '1.0rem' : '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '2px' }}>
                ₱{avgTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Avg Ticket Value
              </span>
              <div style={{ fontSize: isMobileScreen ? '1.0rem' : '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '2px' }}>
                ₱{totalTrendOrders > 0 ? (totalTrendRevenue / totalTrendOrders).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization - Fixed Height, Exactly Matching 7-Day Scale */}
          <div
            className="chart-viewport"
            style={{
              cursor: totalPages > 1 ? 'grab' : 'default',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            {trendLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5,
                gap: '8px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}>
                <RefreshCw size={18} className="spin" />
                <span>Loading {getTimeframeLabel(timeframe)} sales data...</span>
              </div>
            )}

            {/* Direct view of the active slice - strictly 100% width, 4-8 bars */}
            <div
              key={currentPage}
              className="chart-bars-row"
              style={{
                gap: isMobileScreen ? '8px' : (currentSlice.length > 7 ? '12px' : '18px'),
              }}
            >
              {currentSlice.map((day, itemIdx) => {
                const globalIdx = currentPage * pageSize + itemIdx;
                const rev = Number(day.revenue) || 0;
                const heightPct = Math.max(12, Math.round((rev / maxTrendRevenue) * 100));
                const isTodayOrLatest = globalIdx === salesTrend.length - 1;
                const isHovered = hoveredBarIndex === globalIdx;
                const orderCnt = day.orderCount ?? day.orders ?? 0;

                return (
                  <div
                    key={day.date || globalIdx}
                    onMouseEnter={() => setHoveredBarIndex(globalIdx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Tooltip on Hover or Top Label */}
                    <span style={{
                      fontSize: isMobileScreen ? '0.64rem' : '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: isTodayOrLatest ? 'var(--brand-red)' : 'var(--text-muted)',
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      backgroundColor: isHovered ? '#ffffff' : 'transparent',
                      padding: isHovered ? '2px 6px' : '0',
                      borderRadius: '4px',
                      boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                      zIndex: 3,
                    }}>
                      ₱{Math.round(rev).toLocaleString()}
                    </span>

                    {/* Bar graphic */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: isMobileScreen ? '36px' : '44px',
                        height: `${heightPct}%`,
                        backgroundColor: isTodayOrLatest ? 'var(--brand-red)' : isHovered ? '#ef4444' : '#fca5a5',
                        borderRadius: '6px 6px 0 0',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isTodayOrLatest
                          ? '0 4px 14px rgba(224, 26, 34, 0.3)'
                          : isHovered
                          ? '0 4px 10px rgba(0, 0, 0, 0.15)'
                          : 'none',
                        transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                        transformOrigin: 'bottom',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '6px',
                      }}
                      title={`${day.label || day.date}: ₱${rev.toFixed(2)} (${orderCnt} orders)`}
                    >
                      {/* Order Count Label inside bar if tall enough */}
                      {heightPct > 20 && (
                        <span style={{
                          fontSize: isMobileScreen ? '0.62rem' : '0.68rem',
                          color: isTodayOrLatest || isHovered ? '#ffffff' : '#7f1d1d',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}>
                          {orderCnt}
                        </span>
                      )}
                    </div>

                    {/* X-Axis Date/Period label */}
                    <span style={{
                      fontSize: isMobileScreen ? '0.66rem' : '0.75rem',
                      color: isTodayOrLatest ? 'var(--brand-red)' : isHovered ? 'var(--text-main)' : 'var(--text-muted)',
                      fontWeight: isTodayOrLatest ? 800 : isHovered ? 700 : 500,
                      marginTop: '10px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}>
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Chart Footer with Legend & Chunk Pagination */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '16px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            minHeight: '28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--brand-red)', borderRadius: '2px' }} />
                {timeframe === '7d' || timeframe === '15d' || timeframe === '30d' ? "Today's Live Sales" : 'Current Month'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#fca5a5', borderRadius: '2px' }} />
                Past Periods
              </span>
            </div>

            {totalPages > 1 ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="btn btn-secondary"
                  style={{
                    padding: '3px 9px',
                    fontSize: '0.74rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 0 ? 0.35 : 1,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                  }}
                  title="View earlier period"
                >
                  <ChevronLeft size={14} />
                  <span>Earlier</span>
                </button>

                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--bg-app)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                }}>
                  {getChunkLabel(timeframe, currentPage, totalPages, currentSlice)}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="btn btn-secondary"
                  style={{
                    padding: '3px 9px',
                    fontSize: '0.74rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages - 1 ? 0.35 : 1,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                  }}
                  title="View more recent period"
                >
                  <span>Recent</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Numbers inside bars show order counts • Export Excel or Print for PDF report
              </span>
            )}
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
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} style={{ color: lowStockAlerts.length > 0 ? '#b45309' : 'var(--text-muted)' }} />
                Stock Threshold Alerts
              </h2>
              {lowStockAlerts.length > 0 && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {lowStockAlerts.length} {lowStockAlerts.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>

            {lowStockAlerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {lowStockAlerts.map(item => {
                  const isCritical = item.severity === 'critical';
                  return (
                    <div key={item.itemId} style={{
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderLeft: `3px solid ${isCritical ? '#dc2626' : '#f59e0b'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isCritical ? '#dc2626' : '#f59e0b',
                            flexShrink: 0,
                          }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px', paddingLeft: '12px' }}>
                          Current: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.currentStock} {item.unit}</strong>
                          <span style={{ margin: '0 5px', color: 'var(--border-strong)' }}>·</span>
                          Threshold: {item.minStock} {item.unit}
                        </div>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isCritical ? '#fef2f2' : '#fffbeb',
                        color: isCritical ? '#991b1b' : '#92400e',
                        border: `1px solid ${isCritical ? '#fee2e2' : '#fef3c7'}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                      }}>
                        {item.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <CheckCircle2 size={18} color="var(--brand-green)" />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Stock Levels Healthy</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>All ingredients meet minimum thresholds</div>
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
          <div className="responsive-table-wrapper">
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

      {/* Executive Printable Sales Performance Report Modal (Print to PDF / Excel) */}
      {showPrintModal && (
        <div
          className="no-print-overlay modal-responsive-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
        >
          <div
            className="modal-responsive-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Actions Bar (Not printed) */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} color="var(--brand-red)" />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                  Print / Save to PDF Preview
                </span>
                <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                  {getTimeframeLabel(timeframe)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.8rem' }}
                >
                  <FileSpreadsheet size={15} color="#16a34a" />
                  Export Excel (.csv)
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <Printer size={15} />
                  Print / Save as PDF
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Content */}
            <div
              id="takotime-printable-report"
              style={{
                padding: '36px 40px',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                color: '#1e293b',
              }}
            >
              {/* Document Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Tako Time! Operations
                  </div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 2px', letterSpacing: '-0.02em' }}>
                    Sales Performance Report
                  </h1>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                    Montalban Branch • Store Performance & Revenue Ledger
                  </p>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#475569' }}>
                  <div><strong>Timeframe:</strong> {getTimeframeLabel(timeframe)}</div>
                  <div><strong>Periods:</strong> {salesTrend.length} entries</div>
                  <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
                  <div><strong>Branch Code:</strong> TAKO-MTB-01</div>
                </div>
              </div>

              {/* Executive Summary Metrics 4-Box Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Period Net Sales</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#16a34a', fontFamily: 'monospace', marginTop: '4px' }}>
                    ₱{totalTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Completed Orders</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', marginTop: '4px' }}>
                    {totalTrendOrders}
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Average Ticket</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', marginTop: '4px' }}>
                    ₱{totalTrendOrders > 0 ? (totalTrendRevenue / totalTrendOrders).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Peak Period Sales</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#b91c1c', marginTop: '4px' }}>
                    ₱{Math.round(peakTrendItem?.revenue || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Printable Bar Chart Graphic */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 20px', marginBottom: '24px', backgroundColor: '#ffffff', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span>REVENUE TREND OVERVIEW</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Values scaled to peak: ₱{maxTrendRevenue.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: salesTrend.length > 20 ? '4px' : '8px', height: '140px', minWidth: salesTrend.length > 10 ? '480px' : '100%', padding: '8px 0 0', borderBottom: '1px solid #cbd5e1' }}>
                  {salesTrend.map((day, idx) => {
                    const rev = Number(day.revenue) || 0;
                    const heightPct = Math.max(10, Math.round((rev / maxTrendRevenue) * 100));
                    const isLatest = idx === salesTrend.length - 1;
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', minWidth: 0 }}>
                        <div style={{
                          width: '100%',
                          maxWidth: '36px',
                          height: `${heightPct}%`,
                          backgroundColor: isLatest ? '#b91c1c' : '#f87171',
                          borderRadius: '3px 3px 0 0',
                        }} />
                        <span style={{ fontSize: '0.62rem', color: '#475569', marginTop: '4px', whiteSpace: 'nowrap' }}>
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Performance Table */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  ITEMIZED PERIOD SALES BREAKDOWN
                </div>
                <div className="responsive-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                        <th style={{ padding: '8px 12px' }}>Period / Date</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Completed Orders</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Net Sales (PHP)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Avg Ticket</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Sales Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesTrend.map((day, idx) => {
                        const rev = Number(day.revenue) || 0;
                        const orderCnt = day.orderCount ?? day.orders ?? 0;
                        const sharePct = totalTrendRevenue > 0 ? ((rev / totalTrendRevenue) * 100).toFixed(1) : '0.0';
                        const avgTicket = orderCnt > 0 ? (rev / orderCnt).toFixed(2) : '0.00';
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{day.label || day.date}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace' }}>{orderCnt}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#16a34a' }}>
                              ₱{rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>₱{avgTicket}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>{sharePct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #0f172a', fontWeight: 800 }}>
                        <td style={{ padding: '10px 12px' }}>TOTAL</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace' }}>{totalTrendOrders}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontSize: '0.9rem' }}>
                          ₱{totalTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                          ₱{totalTrendOrders > 0 ? (totalTrendRevenue / totalTrendOrders).toFixed(2) : '0.00'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>100.0%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Signatures & Certification Block */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                <div>
                  <div style={{ marginBottom: '32px' }}>Prepared By:</div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>
                    Store Lead Staff / Cashier
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: '32px' }}>Approved & Certified By:</div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>
                    Branch Operations Manager
                  </div>
                </div>
              </div>


              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                Tako Time! POS System • Generated autonomously via Local Store Database & Cloud Sync Bridge
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded print styling for seamless Print to PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #takotime-printable-report,
          #takotime-printable-report * {
            visibility: visible !important;
          }
          #takotime-printable-report {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }
          .no-print,
          .no-print-overlay {
            background-color: transparent !important;
            backdrop-filter: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
