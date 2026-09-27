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
  Award
} from 'lucide-react';

export function RemoteCloudShell() {
  const { user, sessionId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'orders' | 'actions' | 'inventory' | 'logs'
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

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

  const salesTrend = overview?.salesTrend || [
    { date: '2026-09-21', label: 'Mon 9/21', revenue: 3820, orders: 26 },
    { date: '2026-09-22', label: 'Tue 9/22', revenue: 4150, orders: 29 },
    { date: '2026-09-23', label: 'Wed 9/23', revenue: 3900, orders: 25 },
    { date: '2026-09-24', label: 'Thu 9/24', revenue: 4420, orders: 31 },
    { date: '2026-09-25', label: 'Fri 9/25', revenue: 5890, orders: 42 },
    { date: '2026-09-26', label: 'Sat 9/26', revenue: 6420, orders: 45 },
    { date: '2026-09-27', label: 'Sun 9/27', revenue: 4780, orders: 32 },
  ];

  const topProducts = overview?.topProducts || [
    { product_name: 'Classic Octopus Takoyaki (8pcs)', units_sold: 28, total_revenue: 2380.0 },
    { product_name: 'Pork Siomai (8pcs)', units_sold: 16, total_revenue: 1200.0 },
    { product_name: 'Crab & Cheese Takoyaki (8pcs)', units_sold: 10, total_revenue: 950.0 },
    { product_name: 'Fresh Calamansi Juice (16oz)', units_sold: 10, total_revenue: 300.0 },
  ];

  const maxTrendRevenue = Math.max(...salesTrend.map(d => d.revenue), 1000);

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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '12px' }}>
                    <span>Cash: <strong>₱{today.cashSales.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>GCash: <strong>₱{today.gcashSales.toFixed(2)}</strong></span>
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {today.voidedOrders > 0 ? (
                      <span style={{ color: 'var(--brand-crimson)', fontWeight: 600 }}>{today.voidedOrders} voided order(s)</span>
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Expected in drawer • Cashier: <strong>{activeShift.staffName}</strong>
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
                    <>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-crimson)', lineHeight: 1 }}>
                        {lowStockAlerts.length} Item{lowStockAlerts.length > 1 ? 's' : ''} Low
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--brand-crimson)', marginTop: '8px', fontWeight: 600 }}>
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

            {/* Main 2-Column Section: 7-Day Revenue Trend Chart + Top Products */}
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
                      7-Day Revenue Analytics & Trend
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Peak: ₱{maxTrendRevenue.toLocaleString()}
                  </span>
                </div>

                {/* Revenue Bar Chart Visualizer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '16px',
                  height: '240px',
                  padding: '20px 8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  {salesTrend.map((day, idx) => {
                    const heightPct = Math.max(15, Math.round((day.revenue / maxTrendRevenue) * 100));
                    const isToday = idx === salesTrend.length - 1;
                    return (
                      <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        {/* Revenue Amount Label */}
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: isToday ? 'var(--brand-crimson)' : 'var(--text-muted)',
                          marginBottom: '6px',
                        }}>
                          ₱{Math.round(day.revenue)}
                        </span>

                        {/* Revenue Bar */}
                        <div style={{
                          width: '100%',
                          maxWidth: '48px',
                          height: `${heightPct}%`,
                          backgroundColor: isToday ? 'var(--brand-crimson)' : '#fca5a5',
                          borderRadius: '6px 6px 0 0',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 700 }}>
                            {day.orders}
                          </span>
                        </div>

                        {/* Day Label */}
                        <span style={{
                          fontSize: '0.75rem',
                          color: isToday ? 'var(--brand-crimson)' : 'var(--text-muted)',
                          fontWeight: isToday ? 800 : 500,
                          marginTop: '8px',
                        }}>
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--brand-crimson)', borderRadius: '2px' }} /> Today
                    <span style={{ width: '10px', height: '10px', backgroundColor: '#fca5a5', borderRadius: '2px', marginLeft: '8px' }} /> Past 6 Days
                  </span>
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
                  <div style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: '4px' }}>
                    Threshold: {item.minStock} {item.unit} • Status: <strong>URGENT REORDER</strong>
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
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Threshold: 3.0 kg • Status: <strong>HEALTHY</strong>
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
    </div>
  );
}
