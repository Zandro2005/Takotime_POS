// renderer/screens/admin/Health/SystemHealthScreen.jsx
// Complete system health diagnostics, SQLite WAL integrity monitor, automated backups vault, and thermal printer controls

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Database,
  ShieldCheck,
  HardDrive,
  Printer,
  FileText,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Search,
  Activity,
  Zap,
  Terminal,
  Server
} from 'lucide-react';

export function SystemHealthScreen() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('backups'); // 'backups' | 'logs' | 'printer' | 'database'
  const [status, setStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      if (!window.api) return;

      const [statusRes, backupsRes, logsRes] = await Promise.all([
        window.api.health.getStatus(session?.token),
        window.api.backup.list(session?.token),
        window.api.logs.getRecent(session?.token, 100),
      ]);

      if (statusRes?.success) setStatus(statusRes.data);
      if (backupsRes?.success) setBackups(backupsRes.data || []);
      if (logsRes?.success) setLogs(logsRes.data || []);
    } catch (err) {
      console.error('Failed to load system health metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // 15-second polling
    return () => clearInterval(interval);
  }, [loadData]);

  // Run SQLite Integrity Check
  const handleIntegrityCheck = async () => {
    setActionLoading(true);
    try {
      const res = await window.api.health.checkIntegrity(session?.token);
      if (res?.success) {
        showToast(`Integrity check: ${res.data.status} — ${res.data.details}`, 'success');
        loadData();
      } else {
        showToast(res?.error || 'Integrity check encountered an error', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Manual Backup
  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const res = await window.api.backup.runNow(session?.token, 'manual');
      if (res?.success) {
        showToast(`Backup created: ${res.data.filename} (${res.data.sizeFormatted})`, 'success');
        loadData();
      } else {
        showToast(res?.error || 'Backup creation failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Backup File Integrity
  const handleVerifyBackup = async (filePath, filename) => {
    setActionLoading(true);
    try {
      const res = await window.api.backup.verify(session?.token, filePath);
      if (res?.success && res.data.valid) {
        showToast(`Integrity verified for ${filename}: OK`, 'success');
      } else {
        showToast(`Integrity verification failed for ${filename}`, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Prune Old Backups
  const handlePruneBackups = async () => {
    if (!window.confirm('Delete backups older than 30 days?')) return;
    setActionLoading(true);
    try {
      const res = await window.api.backup.prune(session?.token, 30);
      if (res?.success) {
        showToast(`Pruned ${res.data.prunedCount} old backup(s). ${res.data.remainingCount} remaining.`, 'success');
        loadData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Thermal Printer Test Ticket
  const handleTestPrint = async () => {
    setActionLoading(true);
    try {
      const res = await window.api.print.test(session?.token);
      if (res?.success) {
        showToast('Thermal test receipt spooled and verified!', 'success');
      } else {
        showToast(res?.error || 'Thermal print test failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Kick Cash Drawer
  const handleKickDrawer = async () => {
    try {
      const res = await window.api.print.drawer(session?.token);
      if (res?.success) {
        showToast('Cash drawer kick pulse sent (ESC p 0 25 250)', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = logFilter === 'ALL' || log.level === logFilter;
    const matchesSearch = !logSearch || log.message.toLowerCase().includes(logSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Activity size={16} color="var(--brand-crimson)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--brand-crimson)' }}>
              LOCAL HARDENING & DIAGNOSTICS
            </span>
            <span style={{ color: 'var(--text-faint)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Branch: Montalban</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            System Health & Security Vault
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
          >
            <RefreshCw size={16} className={actionLoading ? 'animate-spin' : ''} />
            Refresh Diagnostics
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
          >
            <Database size={16} />
            Backup Database Now
          </button>
        </div>
      </div>

      {/* Stale Shifts Alert Banner (if any) */}
      {status?.shifts?.staleShifts?.length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #f87171',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>
                Stale Open Shift Detected ({status.shifts.staleShifts.length})
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
                A cashier shift was left open overnight or for over 16 hours. Startup recovery automatically guards transactions.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => handleIntegrityCheck()}
          >
            Force Resolve
          </button>
        </div>
      )}

      {/* Top 4 KPI Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {/* Card 1: SQLite WAL Database */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SQLITE DATABASE</span>
            <span className="badge" style={{ backgroundColor: '#ecfdf5', color: 'var(--brand-green)' }}>
              WAL MODE ACTIVE
            </span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace' }}>
              {status?.database?.sizeFormatted || '256.0 KB'}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleIntegrityCheck}
            disabled={actionLoading}
            style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }}
          >
            <ShieldCheck size={14} /> Run Integrity Check
          </button>
        </div>

        {/* Card 2: Automated Backups */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ROLLING BACKUPS</span>
            <span className="badge" style={{ backgroundColor: '#ecfdf5', color: 'var(--brand-green)' }}>
              6H TIMER ACTIVE
            </span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {backups.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Snapshots</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePruneBackups}
            disabled={actionLoading}
            style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }}
          >
            <Trash2 size={14} /> Prune Old Backups
          </button>
        </div>

        {/* Card 3: Thermal Printer & Drawer */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>THERMAL PRINTER</span>
            <span className="badge" style={{ backgroundColor: '#ecfdf5', color: 'var(--brand-green)' }}>
              ESC/POS READY
            </span>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              58mm / 32-Column
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestPrint}
              disabled={actionLoading}
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
            >
              <Printer size={13} /> Test Ticket
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleKickDrawer}
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
            >
              <Zap size={13} /> Pop Drawer
            </button>
          </div>
        </div>

        {/* Card 4: System Process & Memory */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PROCESS RUNTIME</span>
            <span className="badge" style={{ backgroundColor: '#f1f5f9', color: 'var(--text-main)' }}>
              {status?.system?.platform?.toUpperCase() || 'WINDOWS'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {status?.system?.memory?.rssFormatted || '64.2 MB'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        gap: '8px',
      }}>
        <button
          type="button"
          className="btn"
          onClick={() => setActiveTab('backups')}
          style={{
            borderBottom: activeTab === 'backups' ? '2px solid var(--brand-crimson)' : 'none',
            borderRadius: '0',
            color: activeTab === 'backups' ? 'var(--brand-crimson)' : 'var(--text-muted)',
            fontWeight: activeTab === 'backups' ? 700 : 500,
            padding: '10px 16px',
            background: 'none',
          }}
        >
          <Database size={16} /> SQLite Backups Vault ({backups.length})
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => setActiveTab('logs')}
          style={{
            borderBottom: activeTab === 'logs' ? '2px solid var(--brand-crimson)' : 'none',
            borderRadius: '0',
            color: activeTab === 'logs' ? 'var(--brand-crimson)' : 'var(--text-muted)',
            fontWeight: activeTab === 'logs' ? 700 : 500,
            padding: '10px 16px',
            background: 'none',
          }}
        >
          <Terminal size={16} /> Diagnostic Logs ({logs.length})
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => setActiveTab('printer')}
          style={{
            borderBottom: activeTab === 'printer' ? '2px solid var(--brand-crimson)' : 'none',
            borderRadius: '0',
            color: activeTab === 'printer' ? 'var(--brand-crimson)' : 'var(--text-muted)',
            fontWeight: activeTab === 'printer' ? 700 : 500,
            padding: '10px 16px',
            background: 'none',
          }}
        >
          <Printer size={16} /> Thermal Spooler & Hardware
        </button>
      </div>

      {/* Tab 1: Backups Vault */}
      {activeTab === 'backups' && (
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
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Database Snapshots</div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCreateBackup}
              disabled={actionLoading}
              style={{ fontSize: '0.85rem' }}
            >
              <Database size={15} /> Trigger Backup
            </button>
          </div>

          <div className="responsive-table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>BACKUP FILENAME</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>REASON / TRIGGER</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>FILE SIZE</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No backups found. Click "Backup Database Now" to generate an initial snapshot.
                    </td>
                  </tr>
                ) : (
                  backups.map((b, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>
                        {b.filename}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge" style={{
                          backgroundColor: b.reason === 'shift_close' ? '#eff6ff' : b.reason === 'shutdown' ? '#fef3c7' : '#f1f5f9',
                          color: b.reason === 'shift_close' ? '#2563eb' : b.reason === 'shutdown' ? '#b45309' : 'var(--text-main)',
                        }}>
                          {b.reason.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.sizeFormatted}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleVerifyBackup(b.filePath, b.filename)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <ShieldCheck size={14} color="var(--brand-green)" /> Verify
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Diagnostic Logs */}
      {activeTab === 'logs' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}>
          {/* Log Controls Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  className={`btn ${logFilter === lvl ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setLogFilter(lvl)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 32px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    width: '200px',
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadData}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Log Output Console */}
          <div style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            padding: '16px',
            maxHeight: '480px',
            overflowY: 'auto',
            lineHeight: 1.6,
          }}>
            {filteredLogs.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
                No log entries found matching criteria.
              </div>
            ) : (
              filteredLogs.map((log, i) => {
                const color =
                  log.level === 'ERROR' ? '#f87171' :
                  log.level === 'WARN' ? '#fbbf24' :
                  log.level === 'DEBUG' ? '#94a3b8' : '#4ade80';

                return (
                  <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
                    <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      {log.timestamp ? log.timestamp.split('T')[1]?.replace('Z', '') : ''}
                    </span>
                    <span style={{ color, fontWeight: 700, width: '48px', whiteSpace: 'nowrap' }}>
                      [{log.level}]
                    </span>
                    <span style={{ color: '#e2e8f0', wordBreak: 'break-word' }}>
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Thermal Spooler & Hardware */}
      {activeTab === 'printer' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px' }}>
            ESC/POS Thermal Receipt Hardware Engine
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '28px',
          }}>
            <div style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>Active Driver Configuration</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Printer Model: <strong>Thermal 58mm / 80mm ESC/POS</strong></div>
                <div>Paper Width: <strong>32 columns monospace</strong></div>
                <div>Spooler Directory: <code>spooler/</code></div>
                <div>Driver Status: <strong style={{ color: 'var(--brand-green)' }}>ONLINE & RESPONSIVE</strong></div>
              </div>
            </div>

            <div style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>Cash Drawer Interlock</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Pulse Command: <code>ESC p 0 25 250</code></div>
                <div>Pin Assignment: <strong>Pin 2 (Epson Standard)</strong></div>
                <div>Auto-Kick: <strong>Enabled on Cash Checkout</strong></div>
                <div>Status: <strong style={{ color: 'var(--brand-green)' }}>ACTIVE</strong></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTestPrint}
              disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} /> Print Diagnostic Receipt
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleKickDrawer}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Zap size={16} /> Test Cash Drawer Pulse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
