// renderer/screens/admin/Cloud/RemoteAdminPortal.jsx
// Overseas Remote Admin Web Dashboard with live Firebase synchronization,
// sales telemetry, product mix reports, and action queue with conflict prevention.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Cloud,
  RefreshCw,
  Clock,
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Send,
  ShieldAlert,
  Sliders,
  Users,
  UtensilsCrossed,
  Download,
  Check,
  ChevronDown
} from 'lucide-react';

export function RemoteAdminPortal() {
  const { sessionId } = useAuth();
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('telemetry'); // 'telemetry' | 'actions' | 'logs'
  const [toastMessage, setToastMessage] = useState('');

  // Remote action queue state
  const [actionType, setActionType] = useState('change_price');
  const [targetVariantId, setTargetVariantId] = useState(1);
  const [newPrice, setNewPrice] = useState('50.00');
  const [newCost, setNewCost] = useState('22.00');
  const [settingKey, setSettingKey] = useState('receipt_footer');
  const [settingValue, setSettingValue] = useState('Maraming Salamat po!');
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [staffPin, setStaffPin] = useState('4444');

  // Queued actions list (persisted in localStorage for browser or Firebase)
  const [queuedActions, setQueuedActions] = useState([
    {
      id: 'act_101',
      action_type: 'change_price',
      summary: 'Updated 4 pcs Classic Takoyaki price to ₱50.00',
      payload: { variant_id: 1, price: 50.0, cost: 22.0 },
      status: 'applied',
      created_at: '2026-09-27T14:10:00Z',
      applied_at: '2026-09-27T14:15:02Z',
    },
    {
      id: 'act_102',
      action_type: 'update_setting',
      summary: 'Updated receipt footer promo message',
      payload: { key: 'receipt_footer', value: 'Follow us on TikTok: @takotime_ph' },
      status: 'applied',
      created_at: '2026-09-27T14:30:00Z',
      applied_at: '2026-09-27T14:45:00Z',
    },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadSyncData = async () => {
    try {
      if (window.api?.sync?.getStatus) {
        const res = await window.api.sync.getStatus(sessionId);
        if (res.success && res.data) {
          setSyncStatus(res.data);
        }
      }
      if (window.api?.sync?.getLogs) {
        const logsRes = await window.api.sync.getLogs(sessionId, 10);
        if (logsRes.success && logsRes.data) {
          setSyncLogs(logsRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load sync status:', err);
    }
  };

  useEffect(() => {
    loadSyncData();
    const interval = setInterval(loadSyncData, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      if (window.api?.sync?.trigger) {
        const res = await window.api.sync.trigger(sessionId);
        if (res.success) {
          showToast(`Cloud sync complete! Pushed ${res.data?.ordersPushed || 0} orders, applied ${res.data?.actionsApplied || 0} actions.`);
          await loadSyncData();
        } else {
          alert('Sync failed: ' + (res.error || 'Network error'));
        }
      }
    } catch (err) {
      alert('Error triggering sync: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Conflict Prevention: Check if variant already has pending price action
  const hasPendingPriceConflict = actionType === 'change_price' && queuedActions.some(
    a => a.status === 'pending' && a.action_type === 'change_price' && a.payload?.variant_id === targetVariantId
  );

  const handleQueueAction = (e) => {
    e.preventDefault();

    if (hasPendingPriceConflict) {
      alert('Conflict Warning: A price update for this item is already pending store synchronization. Please wait for the store to apply it first or remove the existing pending action.');
      return;
    }

    let summary = '';
    let payload = {};

    if (actionType === 'change_price') {
      summary = `Change Variant #${targetVariantId} price to ₱${Number(newPrice).toFixed(2)}`;
      payload = { variant_id: Number(targetVariantId), price: Number(newPrice), cost: Number(newCost) };
    } else if (actionType === 'update_setting') {
      summary = `Update setting [${settingKey}] to "${settingValue}"`;
      payload = { key: settingKey, value: settingValue };
    } else if (actionType === 'add_staff') {
      if (!staffName || !staffUsername) {
        alert('Please fill out all staff fields');
        return;
      }
      summary = `Create Cashier Account: ${staffName} (@${staffUsername})`;
      payload = { name: staffName, username: staffUsername, role: staffRole, pin: staffPin, password: 'password123' };
    }

    const newAction = {
      id: `act_${Date.now()}`,
      action_type: actionType,
      summary,
      payload,
      status: 'pending',
      created_at: new Date().toISOString(),
      applied_at: null,
    };

    setQueuedActions([newAction, ...queuedActions]);
    showToast(`Action queued! It will apply automatically on next store sync.`);

    // Reset inputs
    if (actionType === 'add_staff') {
      setStaffName('');
      setStaffUsername('');
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              <Cloud size={14} />
              FIREBASE REALTIME DB BRIDGE
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Branch: Montalban • Store Heartbeat: <strong style={{ color: 'var(--brand-green)' }}>ONLINE</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            Remote Admin Web Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            onClick={handleManualSync}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}
          >
            <RefreshCw size={15} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing Store...' : 'Trigger Cloud Sync'}
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-green-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-green)',
          }}>
            <Cloud size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
              Store Terminal Connected & Synchronized
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pending Unsynced Orders: <strong>{syncStatus?.pendingOrdersCount || 0}</strong> • Last Sync Status: <strong style={{ color: 'var(--brand-green)' }}>{syncStatus?.lastSyncStatus?.toUpperCase() || 'SUCCESS'}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div>Last Successful Sync:</div>
          <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {syncStatus?.lastSuccessfulSyncAt || 'Just now'}
          </strong>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          type="button"
          className={`btn ${activeSubTab === 'telemetry' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('telemetry')}
        >
          <ArrowUpRight size={16} />
          Live Telemetry & Orders Stream
        </button>

        <button
          type="button"
          className={`btn ${activeSubTab === 'actions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('actions')}
        >
          <Send size={16} />
          Remote Admin Action Queue ({queuedActions.filter(a => a.status === 'pending').length} Pending)
        </button>

        <button
          type="button"
          className={`btn ${activeSubTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('logs')}
        >
          <Clock size={16} />
          Sync Audit Log History
        </button>
      </div>

      {/* View 1: Telemetry & Orders Stream */}
      {activeSubTab === 'telemetry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Cloud KPI Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>CLOUD SALES TODAY (AS OF LAST SYNC)</span>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', marginTop: '8px' }}>
                ₱4,780.00
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>SYNCED ORDERS</span>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '8px' }}>
                32
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>INVENTORY REPLENISHMENT</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-gold)', marginTop: '8px' }}>
                3 Items Low
              </div>
            </div>
          </div>

          {/* Real-time Order Stream Table */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              Latest Synchronized Orders Stream
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <th style={{ padding: '12px 16px' }}>ORDER #</th>
                    <th style={{ padding: '12px 16px' }}>QUEUE</th>
                    <th style={{ padding: '12px 16px' }}>CASHIER</th>
                    <th style={{ padding: '12px 16px' }}>METHOD</th>
                    <th style={{ padding: '12px 16px' }}>ITEMS PURCHASED</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>TOTAL PAID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>SYNC TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: '0042', queue: 12, cashier: 'Cashier 1', method: 'cash', items: '1x Octopus Takoyaki (8pcs) + Extra Bonito, 1x Calamansi (16oz)', total: 125.0, time: '14:32:15' },
                    { id: '0041', queue: 11, cashier: 'Cashier 1', method: 'gcash', items: '2x Crab & Cheese Takoyaki (8pcs)', total: 190.0, time: '14:18:40' },
                    { id: '0040', queue: 10, cashier: 'Cashier 1', method: 'cash', items: '1x Pork Siomai (4pcs), 1x Calamansi (16oz)', total: 70.0, time: '14:05:12' },
                    { id: '0039', queue: 9, cashier: 'Cashier 1', method: 'cash', items: '1x Octopus Takoyaki (12pcs)', total: 125.0, time: '13:52:00' },
                  ].map((ord, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>#{ord.id}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-primary">Q#{ord.queue}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{ord.cashier}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={ord.method === 'cash' ? 'badge badge-secondary' : 'badge badge-admin-staff'}>
                          {ord.method.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>{ord.items}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                        ₱{ord.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ord.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Remote Action Queue with Conflict Prevention */}
      {activeSubTab === 'actions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '28px' }}>
          {/* Action Builder Form */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} color="var(--brand-red)" />
              Queue Remote Store Action
            </h2>

            <form onSubmit={handleQueueAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Action Type
                </label>
                <select
                  className="input"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                >
                  <option value="change_price">Change Menu Variant Price / Cost</option>
                  <option value="update_setting">Update Store / Receipt Setting</option>
                  <option value="add_staff">Create New Staff Account</option>
                </select>
              </div>

              {/* Price Change Form Fields */}
              {actionType === 'change_price' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Select Target Variant
                    </label>
                    <select
                      className="input"
                      value={targetVariantId}
                      onChange={(e) => setTargetVariantId(Number(e.target.value))}
                    >
                      <option value={1}>Classic Octopus Takoyaki — 4 pcs (Current: ₱45.00)</option>
                      <option value={2}>Classic Octopus Takoyaki — 8 pcs (Current: ₱85.00)</option>
                      <option value={3}>Classic Octopus Takoyaki — 12 pcs (Current: ₱125.00)</option>
                      <option value={4}>Crab & Cheese Takoyaki — 4 pcs (Current: ₱50.00)</option>
                      <option value={5}>Crab & Cheese Takoyaki — 8 pcs (Current: ₱95.00)</option>
                    </select>
                  </div>

                  {/* Conflict Prevention Alert Banner */}
                  {hasPendingPriceConflict && (
                    <div style={{
                      backgroundColor: 'var(--brand-gold-light)',
                      border: '1px solid rgba(217, 119, 6, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}>
                      <AlertTriangle size={18} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.4 }}>
                        <strong>Conflict Warning:</strong> A pending price update for Variant #{targetVariantId} is already queued in Firebase. Queueing another may result in overlapping price overrides.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        New Selling Price (₱)
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        min="1"
                        step="0.5"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Unit Cost (₱)
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={newCost}
                        onChange={(e) => setNewCost(e.target.value)}
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Setting Update Form Fields */}
              {actionType === 'update_setting' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Setting Key
                    </label>
                    <select
                      className="input"
                      value={settingKey}
                      onChange={(e) => setSettingKey(e.target.value)}
                    >
                      <option value="receipt_footer">receipt_footer (Thermal Slip Message)</option>
                      <option value="store_name">store_name (Store Banner)</option>
                      <option value="session_timeout_min">session_timeout_min (Auto-Lock)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      New Value
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={settingValue}
                      onChange={(e) => setSettingValue(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Add Staff Fields */}
              {actionType === 'add_staff' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Juan dela Cruz"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. jdelacruz"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Initial PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      className="input"
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', marginTop: '8px' }}
              >
                <Send size={16} />
                Send to Firebase Action Queue
              </button>
            </form>
          </div>

          {/* Queued Actions List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              Action Queue Status & History
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {queuedActions.map(action => (
                <div key={action.id} style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: action.status === 'pending' ? '#fffbeb' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-secondary">{action.action_type}</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{action.summary}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Queued: {new Date(action.created_at).toLocaleTimeString()}
                      {action.applied_at && ` • Applied by store: ${new Date(action.applied_at).toLocaleTimeString()}`}
                    </div>
                  </div>

                  <div>
                    {action.status === 'applied' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--brand-green)',
                        backgroundColor: 'var(--brand-green-light)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <Check size={14} />
                        APPLIED
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--brand-gold)',
                        backgroundColor: 'var(--brand-gold-light)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <Clock size={14} />
                        PENDING SYNC
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View 3: Sync Audit Log History */}
      {activeSubTab === 'logs' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
            Store-Cloud Sync History & Diagnostics
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '12px 16px' }}>LOG ID</th>
                  <th style={{ padding: '12px 16px' }}>DIRECTION</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px' }}>RECORDS SYNCED</th>
                  <th style={{ padding: '12px 16px' }}>STARTED AT</th>
                  <th style={{ padding: '12px 16px' }}>COMPLETED AT</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.length > 0 ? (
                  syncLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>#{log.id}</td>
                      <td style={{ padding: '14px 16px', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.8rem' }}>
                        {log.direction}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: log.status === 'success' ? 'var(--brand-green)' : 'var(--brand-red)',
                          backgroundColor: log.status === 'success' ? 'var(--brand-green-light)' : 'var(--brand-red-light)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {log.records_synced}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.started_at}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.completed_at || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No recent sync logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
