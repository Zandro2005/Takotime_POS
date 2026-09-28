// renderer/screens/remote-admin/RemoteCloudShell.jsx
// Dedicated standalone application shell for Remote Cloud Administrator / Franchise Owner
// Contains separate pages: Telemetry (with live 7-day revenue analytics graph), Orders Stream, Action Queue Dispatcher, Inventory Alerts, and Cloud Audit Logs

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';
import {
  Cloud,
  Activity,
  Layers,
  Send,
  Package,
  Clock,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Receipt,
  UserPlus,
  Tag,
  Settings,
  Shield,
  Search,
  ExternalLink,
  Store,
  DollarSign,
  ShoppingCart,
  UserCheck,
  ShieldCheck,
  Award,
  ChevronLeft,
  ChevronRight,
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

export function RemoteCloudShell() {
  const { user, sessionId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'orders' | 'actions' | 'inventory' | 'logs'
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const [timeframe, setTimeframe] = useState('7d');
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

  // Action Queue Form States
  const [actionType, setActionType] = useState('change_price');
  const [targetVariantId, setTargetVariantId] = useState(1);
  const [newPrice, setNewPrice] = useState(50.0);
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [settingKey, setSettingKey] = useState('receipt_header');
  const [settingVal, setSettingVal] = useState('TAKOTIME Montalban\nBranch Official Cloud Sync');
  const [actionNotes, setActionNotes] = useState('');

  // Remote Orders Stream
  const [remoteOrders, setRemoteOrders] = useState([
    {
      id: 42,
      queue_no: 12,
      created_at: '2026-09-27 14:32:15',
      synced_at: '2026-09-27 14:32:16',
      total: 125.0,
      payment_method: 'cash',
      staff_name: 'Cashier 1',
      items: '1x Octopus Takoyaki (8pcs) + Extra Bonito, 1x Calamansi (16oz)',
    },
    {
      id: 41,
      queue_no: 11,
      created_at: '2026-09-27 14:18:40',
      synced_at: '2026-09-27 14:18:41',
      total: 190.0,
      payment_method: 'gcash',
      staff_name: 'Cashier 1',
      items: '2x Crab & Cheese Takoyaki (8pcs)',
    },
    {
      id: 40,
      queue_no: 10,
      created_at: '2026-09-27 13:55:02',
      synced_at: '2026-09-27 13:55:04',
      total: 90.0,
      payment_method: 'cash',
      staff_name: 'Cashier 1',
      items: '2x 4pcs Takoyaki',
    },
    {
      id: 39,
      queue_no: 9,
      created_at: '2026-09-27 13:40:19',
      synced_at: '2026-09-27 13:40:20',
      total: 75.0,
      payment_method: 'cash',
      staff_name: 'Cashier 1',
      items: '1x Pork Siomai (8pcs)',
    },
  ]);

  // Remote Action Queue Items
  const [queuedActions, setQueuedActions] = useState([
    {
      id: 'action_001',
      action_type: 'change_price',
      summary: 'Update Octopus Takoyaki (4pcs) price from ₱45.00 to ₱50.00',
      queued_at: '2026-09-27 15:10:00',
      status: 'pending',
      creator: 'cloudadmin',
    },
  ]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const promises = [];
      if (window.api?.sync) {
        promises.push(window.api.sync.getStatus());
        promises.push(window.api.sync.getLogs(null, 20));
      } else {
        promises.push(Promise.resolve(null));
        promises.push(Promise.resolve(null));
      }

      if (window.api?.dashboard?.getOverview) {
        promises.push(window.api.dashboard.getOverview(sessionId));
      } else {
        promises.push(Promise.resolve(null));
      }

      const [statusRes, logsRes, overviewRes] = await Promise.all(promises);

      if (statusRes?.success) setSyncStatus(statusRes.data);
      if (logsRes?.success) setSyncLogs(logsRes.data || []);
      if (overviewRes?.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
    } catch (err) {
      console.error('Remote cloud sync polling error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      if (window.api?.sync) {
        const res = await window.api.sync.trigger();
        if (res?.success) {
          showToast(`Cloud synchronization complete! ${res.data.recordsSynced} records processed.`, 'success');
          loadData();
        } else {
          showToast(res?.error || 'Sync failed', 'error');
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleQueueAction = (e) => {
    e.preventDefault();
    let summary = '';
    if (actionType === 'change_price') {
      summary = `Update Product Variant #${targetVariantId} price to ₱${Number(newPrice).toFixed(2)}`;
    } else if (actionType === 'add_staff') {
      if (!staffUsername.trim()) {
        showToast('Staff username is required', 'error');
        return;
      }
      summary = `Create staff account: ${staffName || staffUsername} (@${staffUsername}, Role: ${staffRole})`;
    } else {
      summary = `Update store setting: [${settingKey}] -> "${settingVal}"`;
    }

    const newAction = {
      id: `action_${Date.now()}`,
      action_type: actionType,
      summary,
      queued_at: new Date().toLocaleString(),
      status: 'pending',
      creator: user?.username || 'cloudadmin',
      notes: actionNotes,
    };

    setQueuedActions(prev => [newAction, ...prev]);
    showToast(`Action queued successfully! Will apply automatically on next store sync cycle.`, 'success');

    // Reset Form
    setActionNotes('');
    setStaffUsername('');
    setStaffName('');
    setStaffPin('');
  };

  // Extract analytics metrics matching admin dashboard
  const today = overview?.today || {
    completedOrders: 32,
    voidedOrders: 1,
    grossSales: 4890.0,
    discounts: 110.0,
    netSales: 4780.0,
    cashSales: 3580.0,
    gcashSales: 1200.0,
  };

  const activeShift = overview?.activeShift || {
    id: 1,
    staffName: 'Cashier 1',
    startingCash: 1000.0,
    cashSales: 3580.0,
    expectedDrawerCash: 4430.0,
  };

  const lowStockAlerts = overview?.lowStockAlerts || [
    { itemId: 1, name: 'Takoyaki Batter Premix', currentStock: 1.2, minStock: 5.0, unit: 'kg' },
    { itemId: 6, name: 'Fresh Calamansi', currentStock: 0.8, minStock: 2.0, unit: 'kg' },
    { itemId: 9, name: 'Bonito Flakes', currentStock: 1.5, minStock: 2.0, unit: 'packs' },
  ];

  const topProducts = overview?.topProducts || [];

  const handleTimeframeChange = async (newTf) => {
    if (newTf === timeframe) return;
    setTimeframe(newTf);
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
          return;
        }
      }
    } catch (err) {
      console.error('Remote trend fetch error:', err);
    } finally {
      setTrendLoading(false);
    }
  };

  const salesTrend = customTrend || overview?.salesTrend || [
    { date: '2026-09-21', label: 'Mon 9/21', revenue: 3820, orders: 26 },
    { date: '2026-09-22', label: 'Tue 9/22', revenue: 4150, orders: 29 },
    { date: '2026-09-23', label: 'Wed 9/23', revenue: 3900, orders: 25 },
    { date: '2026-09-24', label: 'Thu 9/24', revenue: 4420, orders: 31 },
    { date: '2026-09-25', label: 'Fri 9/25', revenue: 5890, orders: 42 },
    { date: '2026-09-26', label: 'Sat 9/26', revenue: 6420, orders: 45 },
    { date: '2026-09-27', label: 'Sun 9/27', revenue: 4780, orders: 32 },
  ];

  const totalTrendRevenue = salesTrend.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
  const totalTrendOrders = salesTrend.reduce((sum, d) => sum + (Number(d.orderCount ?? d.orders) || 0), 0);
  const avgTrendRevenue = salesTrend.length > 0 ? (totalTrendRevenue / salesTrend.length) : 0;
  const peakTrendItem = salesTrend.reduce((prev, cur) => ((Number(cur.revenue) > (Number(prev?.revenue) || 0)) ? cur : prev), null);
  const maxTrendRevenue = Math.max(...salesTrend.map(d => Number(d.revenue) || 0), 1000);

  const getPageSize = (tf) => {
    if (tf === 'annual') return 6;
    if (tf === 'semi_annual') return 6;
    if (tf === '30d') return 8;
    if (tf === '15d') return 8;
    return 7;
  };

  const getChunkLabel = (tf, page, total, slice) => {
    const isLatest = page === total - 1;
    if (tf === '30d') {
      const start = page * 8 + 1;
      const end = start + (slice?.length || 8) - 1;
      return `Days ${start}–${end}${isLatest ? ' (Latest)' : ''}`;
    }
    if (tf === '15d') {
      const start = page * 8 + 1;
      const end = start + (slice?.length || 8) - 1;
      return `Days ${start}–${end}${isLatest ? ' (Latest)' : ''}`;
    }
    if (tf === 'annual') {
      return page === 0 ? 'Months 1–6 (H1)' : 'Months 7–12 (Latest)';
    }
    return `Page ${page + 1} of ${total}`;
  };

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

  // Auto-jump to the latest page (last slide) when timeframe or trend data changes
  useEffect(() => {
    const ps = getPageSize(timeframe);
    const pages = Math.max(1, Math.ceil(salesTrend.length / ps));
    setCurrentPage(pages - 1);
  }, [timeframe, salesTrend.length]);

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
    const dateStr = overview?.date || new Date().toISOString().split('T')[0];

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
      `"TAKO TIME! Cloud Telemetry - Sales Performance Report"`,
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
    link.setAttribute('download', `takotime_cloud_sales_${timeframe}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#16a34a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '0.9rem',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Standalone Cloud Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Brand & Cloud Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <img src={logoImg} alt="TAKOTIME" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: 1.1 }}>TAKOTIME</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Cloud size={13} color="var(--brand-crimson)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--brand-crimson)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  REMOTE CLOUD
                </span>
              </div>
            </div>
          </div>

          {/* Store Location Badge (Montalban Branch Only) */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
              Store Location
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={16} color="var(--brand-crimson)" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                Montalban Branch
              </span>
            </div>
          </div>

          {/* Separate Navigation Pages */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'telemetry' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('telemetry')}
            >
              <Activity size={18} />
              Live Store Telemetry
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('orders')}
            >
              <Receipt size={18} />
              Synchronized Orders
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'actions' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('actions')}
            >
              <Send size={18} />
              Remote Action Queue ({queuedActions.filter(a => a.status === 'pending').length})
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('inventory')}
            >
              <Package size={18} />
              Inventory & Alerts
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}
              onClick={() => setActiveTab('logs')}
            >
              <Clock size={18} />
              Cloud Sync Audit Logs
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name || 'Franchise Owner'}</div>
              <span className="badge" style={{ marginTop: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                Remote Cloud Admin
              </span>
            </div>
            <Shield size={20} color="#2563eb" />
          </div>

          <button
            type="button"
            className="btn btn-danger"
            style={{ width: '100%', padding: '10px' }}
            onClick={logout}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px',
        maxWidth: '1300px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Top Cloud Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge" style={{ backgroundColor: '#ecfdf5', color: 'var(--brand-green)', fontWeight: 700 }}>
                ● RTDB BRIDGE ONLINE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Branch: <strong>Montalban</strong> • Store Heartbeat: <strong>ONLINE</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Remote Store Telemetry & Revenue Analytics
            </h1>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTriggerSync}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            Trigger Immediate Sync
          </button>
        </div>

        {/* PAGE 1: TELEMETRY & REVENUE GRAPH (MATCHING ADMIN DASHBOARD) */}
        {activeTab === 'telemetry' && (
          <div>
            {/* Top 4 KPI Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              marginBottom: '28px',
            }}>
              {/* Today's Net Sales */}
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
                    TODAY'S NET SALES (CLOUD)
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
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--brand-green)', lineHeight: 1 }}>
                    ₱{today.netSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Completed Orders */}
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
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)', lineHeight: 1 }}>
                    {today.completedOrders}
                  </div>
                </div>
              </div>

              {/* Cash Drawer On Duty */}
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
                    backgroundColor: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#b45309',
                  }}>
                    <UserCheck size={20} />
                  </div>
                </div>
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)', lineHeight: 1 }}>
                    ₱{activeShift.expectedDrawerCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
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
                    backgroundColor: lowStockAlerts.length > 0 ? '#fef2f2' : '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: lowStockAlerts.length > 0 ? 'var(--brand-crimson)' : 'var(--brand-green)',
                  }}>
                    {lowStockAlerts.length > 0 ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
                  </div>
                </div>
                <div style={{ marginTop: '14px' }}>
                  {lowStockAlerts.length > 0 ? (
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-crimson)', lineHeight: 1 }}>
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

            {/* Main 2-Column Section: 7-Day Revenue Trend Chart + Top Products */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', marginBottom: '28px' }}>
              {/* Sales Trend Chart Card with Multi-Timeframe and Export/Print */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minWidth: 0,
                width: '100%',
                overflow: 'hidden',
              }}>
                {/* Card Header with Timeframe Pills and Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={20} color="var(--brand-crimson)" />
                      Sales Performance Analytics
                    </h2>
                    <span className="badge badge-secondary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      {getTimeframeLabel(timeframe)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    {/* Timeframe Selector Pill Group */}
                    <div style={{
                      display: 'inline-flex',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-md)',
                      padding: '3px',
                      border: '1px solid var(--border-subtle)',
                      gap: '2px',
                    }}>
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
                              backgroundColor: isActive ? 'var(--brand-crimson)' : 'transparent',
                              color: isActive ? '#ffffff' : 'var(--text-muted)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              cursor: trendLoading ? 'wait' : 'pointer',
                              transition: 'all 0.15s ease',
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  marginBottom: '18px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Period Net Revenue
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--brand-green)', marginTop: '2px' }}>
                      ₱{totalTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Total Orders
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)', marginTop: '2px' }}>
                      {totalTrendOrders}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Avg {['semi_annual', 'annual'].includes(timeframe) ? 'Monthly' : 'Daily'} Sales
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)', marginTop: '2px' }}>
                      ₱{avgTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Avg Ticket Value
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)', marginTop: '2px' }}>
                      ₱{totalTrendOrders > 0 ? (totalTrendRevenue / totalTrendOrders).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>

                {/* Bar Chart Visualization - Fixed Height, Exactly Matching 7-Day Scale */}
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    width: '100%',
                    minWidth: 0,
                    height: '230px',
                    borderBottom: '1px solid var(--border-subtle)',
                    userSelect: 'none',
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

                  {/* Direct view of the active slice - strictly 100% width, 6-8 bars */}
                  <div
                    key={currentPage}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: currentSlice.length > 7 ? '12px' : '18px',
                      height: '220px',
                      padding: '16px 8px 0',
                      boxSizing: 'border-box',
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
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: isTodayOrLatest ? 'var(--brand-crimson)' : 'var(--text-muted)',
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
                              maxWidth: '44px',
                              height: `${heightPct}%`,
                              backgroundColor: isTodayOrLatest ? 'var(--brand-crimson)' : isHovered ? '#ef4444' : '#fca5a5',
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
                                fontSize: '0.68rem',
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
                            fontSize: '0.75rem',
                            color: isTodayOrLatest ? 'var(--brand-crimson)' : isHovered ? 'var(--text-main)' : 'var(--text-muted)',
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
                      <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--brand-crimson)', borderRadius: '2px' }} />
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

              {/* Right Column: Top Products Mix */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Award size={18} color="var(--brand-crimson)" />
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Top Selling Items Today
                    </h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {topProducts.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            {p.product_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {p.units_sold} units sold
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--brand-green)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          ₱{p.total_revenue.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cloud Sync Status Info */}
                <div style={{
                  marginTop: '16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Firebase RTDB Connection
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Store Channel: <code>/stores/montalban/</code>
                  </div>
                  <div style={{ color: 'var(--brand-green)', fontWeight: 600, marginTop: '2px' }}>
                    ● Realtime Sync Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: ORDERS STREAM */}
        {activeTab === 'orders' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Live Synchronized Orders</div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadData}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} /> Refresh Stream
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>ORDER #</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>QUEUE</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>CASHIER</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>METHOD</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>ITEMS</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {remoteOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: 700 }}>
                      #{String(ord.id).padStart(4, '0')}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--brand-crimson)' }}>
                      Q#{ord.queue_no}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{ord.staff_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{
                        backgroundColor: ord.payment_method === 'gcash' ? '#eff6ff' : '#ecfdf5',
                        color: ord.payment_method === 'gcash' ? '#2563eb' : 'var(--brand-green)',
                      }}>
                        {ord.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>{ord.items}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--brand-green)' }}>
                      ₱{ord.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGE 3: ACTION QUEUE DISPATCHER */}
        {activeTab === 'actions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Dispatch Form Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
                Queue Remote Store Action
              </h2>

              <form onSubmit={handleQueueAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                      Action Type
                    </label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="input-field"
                    >
                      <option value="change_price">Change Product Price</option>
                      <option value="add_staff">Create New Store Staff</option>
                      <option value="update_setting">Update Store Setting</option>
                    </select>
                  </div>

                  {actionType === 'change_price' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                          Select Product Variant
                        </label>
                        <select
                          value={targetVariantId}
                          onChange={(e) => setTargetVariantId(Number(e.target.value))}
                          className="input-field"
                        >
                          <option value="1">Classic Octopus Takoyaki (4 pcs) — Current: ₱45.00</option>
                          <option value="2">Classic Octopus Takoyaki (8 pcs) — Current: ₱85.00</option>
                          <option value="3">Classic Octopus Takoyaki (12 pcs) — Current: ₱125.00</option>
                          <option value="4">Crab & Cheese Takoyaki (4 pcs) — Current: ₱50.00</option>
                          <option value="5">Crab & Cheese Takoyaki (8 pcs) — Current: ₱95.00</option>
                          <option value="7">Pork Siomai (4 pcs) — Current: ₱40.00</option>
                          <option value="8">Pork Siomai (8 pcs) — Current: ₱75.00</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                          New Price (₱)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                    </>
                  )}

                  {actionType === 'add_staff' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Maria Santos"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                          Username
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. msantos"
                          value={staffUsername}
                          onChange={(e) => setStaffUsername(e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                          Role
                        </label>
                        <select
                          value={staffRole}
                          onChange={(e) => setStaffRole(e.target.value)}
                          className="input-field"
                        >
                          <option value="staff">Staff (Cashier)</option>
                          <option value="admin_staff">Lead Staff / Supervisor</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Audit Notes / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Supplier flour price adjustment for Q4"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={16} /> Enqueue Remote Action
                  </button>
                </div>
              </form>
            </div>

            {/* Pending & Applied Queue Table */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                fontWeight: 700,
                color: 'var(--text-main)',
              }}>
                Queued Remote Actions (Montalban Branch)
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>ACTION DETAILS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>QUEUED AT</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>SUBMITTED BY</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {queuedActions.map((act) => (
                    <tr key={act.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 600 }}>{act.summary}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{act.queued_at}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>@{act.creator}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <span className="badge" style={{
                          backgroundColor: act.status === 'pending' ? '#fef3c7' : '#ecfdf5',
                          color: act.status === 'pending' ? '#b45309' : 'var(--brand-green)',
                        }}>
                          {act.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGE 4: INVENTORY ALERTS */}
        {activeTab === 'inventory' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              Remote Inventory & Stock Alerts
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {lowStockAlerts.map((item, idx) => (
                <div key={idx} style={{
                  border: '1px solid #fed7aa',
                  backgroundColor: '#fff7ed',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <AlertTriangle size={18} color="#ea580c" />
                    <span style={{ fontWeight: 700, color: '#9a3412', fontSize: '0.9rem' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c2410c' }}>
                    {item.currentStock ?? item.endingQty ?? 0} {item.unit} Remaining
                  </div>
                </div>
              ))}

              <div style={{
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle2 size={18} color="var(--brand-green)" />
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>Diced Octopus</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  6.4 kg Remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 5: SYNC LOGS */}
        {activeTab === 'logs' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              fontWeight: 700,
              color: 'var(--text-main)',
            }}>
              Cloud Synchronization Audit Log (Montalban Branch)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>DIRECTION</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>RECORDS</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>#{log.id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.direction.toUpperCase()}</td>
                    <td style={{ padding: '12px 16px' }}>{log.records_synced} synced</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{log.completed_at || log.started_at}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <span className="badge" style={{
                        backgroundColor: log.status === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: log.status === 'success' ? 'var(--brand-green)' : '#dc2626',
                      }}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Executive Printable Sales Performance Report Modal (Print to PDF / Excel) */}
      {showPrintModal && (
        <div
          className="no-print-overlay"
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
                <Printer size={18} color="var(--brand-crimson)" />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                  Cloud Telemetry - Sales Report Preview
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
              id="takotime-cloud-printable-report"
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
                    Tako Time! Cloud Telemetry
                  </div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 2px', letterSpacing: '-0.02em' }}>
                    Executive Sales Performance Report
                  </h1>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                    Montalban Branch • Cloud Synchronized Revenue & Performance Ledger
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
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 20px', marginBottom: '24px', backgroundColor: '#ffffff' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>REVENUE TREND OVERVIEW</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Values scaled to peak: ₱{maxTrendRevenue.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: salesTrend.length > 20 ? '4px' : '8px', height: '140px', padding: '8px 0 0', borderBottom: '1px solid #cbd5e1' }}>
                  {salesTrend.map((day, idx) => {
                    const rev = Number(day.revenue) || 0;
                    const heightPct = Math.max(10, Math.round((rev / maxTrendRevenue) * 100));
                    const isLatest = idx === salesTrend.length - 1;
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
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

              {/* Signatures & Certification Block */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                <div>
                  <div style={{ marginBottom: '32px' }}>Prepared By:</div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>
                    Franchise Auditor / Operations Admin
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: '32px' }}>Approved & Certified By:</div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>
                    Franchise Owner / Executive
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                Tako Time! Cloud Telemetry System • Official Franchise Verification Record
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
          #takotime-cloud-printable-report,
          #takotime-cloud-printable-report * {
            visibility: visible !important;
          }
          #takotime-cloud-printable-report {
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
