// renderer/screens/admin/Settings/StoreSettings.jsx
// Store profile, receipt customization with live receipt preview, and operational parameters.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Settings,
  Store,
  Receipt,
  Clock,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  DollarSign,
  Cloud,
  Database,
  FileText
} from 'lucide-react';

export function StoreSettings() {
  const { sessionId } = useAuth();
  const [settings, setSettings] = useState({
    store_name: 'TAKOTIME - Montalban',
    branch_name: 'Montalban Branch',
    branch_address: 'Rodriguez Highway, Montalban, Rizal',
    branch_contact: '0917-123-4567',
    receipt_header: 'TAKOTIME\nMontalban Branch\nTel: (02) 8123-4567',
    receipt_footer: 'Maraming Salamat!\nCome Again!',
    session_timeout_min: '30',
    sync_interval_min: '15',
    backup_interval_hrs: '6',
    tax_rate: '0',
    currency_symbol: '₱',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (window.api?.settings?.getAll) {
        const res = await window.api.settings.getAll(sessionId);
        if (res.success && res.data) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [sessionId]);

  const handleFieldChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (window.api?.settings?.update) {
        const res = await window.api.settings.update(sessionId, settings);
        if (res.success) {
          showToast('Settings saved successfully!');
          if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
        } else {
          alert('Failed to save settings: ' + (res.error || 'Unknown error'));
        }
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="responsive-page-container">
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Store & Operational Settings
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
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px' }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Main Grid: Settings Sections on Left, Live Receipt Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '28px' }}>
        {/* Left Column: Form Sections */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Store Profile */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={18} color="var(--brand-red)" />
              Store Profile & Location
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.store_name}
                  onChange={(e) => handleFieldChange('store_name', e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Branch Identifier
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.branch_name || ''}
                  onChange={(e) => handleFieldChange('branch_name', e.target.value)}
                  placeholder="e.g. Montalban Branch"
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Store Address
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.branch_address || ''}
                  onChange={(e) => handleFieldChange('branch_address', e.target.value)}
                  placeholder="e.g. Rodriguez Highway, Montalban, Rizal"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Contact Phone / Mobile
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.branch_contact || ''}
                  onChange={(e) => handleFieldChange('branch_contact', e.target.value)}
                  placeholder="e.g. 0917-123-4567"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Currency Symbol
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.currency_symbol || '₱'}
                  onChange={(e) => handleFieldChange('currency_symbol', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Receipt Layout */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="var(--brand-gold)" />
              Thermal Paper Receipt Customization
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Receipt Header (printed at top of thermal slip)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={settings.receipt_header}
                  onChange={(e) => handleFieldChange('receipt_header', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Receipt Footer (printed at bottom of thermal slip)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={settings.receipt_footer}
                  onChange={(e) => handleFieldChange('receipt_footer', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Operational Timers & Safety */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#2563eb" />
              Operational Automation & Security
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Inactivity Auto-Lock Timeout
                </label>
                <select
                  className="input"
                  value={settings.session_timeout_min}
                  onChange={(e) => handleFieldChange('session_timeout_min', e.target.value)}
                >
                  <option value="10">10 minutes idle</option>
                  <option value="15">15 minutes idle</option>
                  <option value="30">30 minutes idle (Recommended)</option>
                  <option value="60">60 minutes idle</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  SQLite Rolling Backup Interval
                </label>
                <select
                  className="input"
                  value={settings.backup_interval_hrs}
                  onChange={(e) => handleFieldChange('backup_interval_hrs', e.target.value)}
                >
                  <option value="2">Every 2 hours</option>
                  <option value="6">Every 6 hours (Recommended)</option>
                  <option value="12">Every 12 hours</option>
                  <option value="24">Daily (every 24 hours)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Firebase Cloud Sync Interval
                </label>
                <select
                  className="input"
                  value={settings.sync_interval_min}
                  onChange={(e) => handleFieldChange('sync_interval_min', e.target.value)}
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes (Standard)</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every 1 hour</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Sales Tax / VAT Rate (%)
                </label>
                <input
                  type="number"
                  className="input"
                  value={settings.tax_rate}
                  onChange={(e) => handleFieldChange('tax_rate', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Right Column: Live Thermal Receipt Preview */}
        <div>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: '20px',
          }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--brand-red)" />
              Thermal Slip Preview
            </h2>

            {/* Receipt Box */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              lineHeight: 1.45,
              color: '#1e293b',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
            }}>
              {/* Header */}
              <div style={{ textAlign: 'center', whiteSpace: 'pre-line', fontWeight: 700, marginBottom: '12px' }}>
                {settings.receipt_header || 'TAKOTIME POS'}
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', margin: '8px 0' }} />

              {/* Order Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ORDER: #0042</span>
                <span style={{ fontWeight: 800 }}>QUEUE: #12</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>DATE: 2026-09-27</span>
                <span>TIME: 14:32</span>
              </div>
              <div style={{ color: '#64748b' }}>CASHIER: Maria (Cashier 1)</div>

              <div style={{ borderTop: '1px dashed #cbd5e1', margin: '8px 0' }} />

              {/* Line Items */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>ITEM</span>
                <span>PRICE</span>
              </div>
              <div style={{ borderTop: '1px solid #cbd5e1', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>1x Octopus Takoyaki (8pcs)</span>
                <span>₱85.00</span>
              </div>
              <div style={{ paddingLeft: '8px', color: '#64748b', fontSize: '0.72rem' }}>
                + Extra Bonito Flakes (₱10.00)
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>1x Fresh Calamansi (16oz)</span>
                <span>₱30.00</span>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', margin: '8px 0' }} />

              {/* Calculations */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SUBTOTAL:</span>
                <span>₱125.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>DISCOUNT:</span>
                <span>₱0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.88rem', marginTop: '4px' }}>
                <span>TOTAL:</span>
                <span>₱125.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>CASH TENDERED:</span>
                <span>₱200.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>CHANGE:</span>
                <span>₱75.00</span>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', margin: '12px 0 8px' }} />

              {/* Footer */}
              <div style={{ textAlign: 'center', whiteSpace: 'pre-line', color: '#475569', fontSize: '0.74rem' }}>
                {settings.receipt_footer || 'Thank you!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
