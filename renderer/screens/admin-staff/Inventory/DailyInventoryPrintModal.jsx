// renderer/screens/admin-staff/Inventory/DailyInventoryPrintModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  X,
  Store,
  MapPin,
  UserCheck,
  User,
  Calendar,
  Check
} from 'lucide-react';
import {
  buildDailyInventoryRows,
  exportDailyInventoryXlsx,
  printDailyInventorySheet
} from '../../../utils/dailyInventoryExcel';

export function DailyInventoryPrintModal({
  isOpen,
  onClose,
  systemItems = [],
  selectedDate = '',
  currentUser = null,
}) {
  const [branch, setBranch] = useState('MONTALBAN');
  const [address, setAddress] = useState('Rodriguez Highway, Montalban, Rizal');
  const [preparedBy, setPreparedBy] = useState(currentUser?.name || 'Lead Staff');
  const [checkedBy, setCheckedBy] = useState('');
  const [includeExtras, setIncludeExtras] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Auto-fill branch and address from settings if available
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        if (window.api?.settings?.getAll) {
          const res = await window.api.settings.getAll();
          if (isMounted && res?.data) {
            if (res.data.branch_name) setBranch(res.data.branch_name);
            if (res.data.branch_address) setAddress(res.data.branch_address);
          }
        }
      } catch (err) {
        // Fallback to defaults
      }
    }
    loadSettings();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (currentUser?.name) {
      setPreparedBy(currentUser.name);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const { rows, extraRows } = buildDailyInventoryRows(systemItems, selectedDate);
  const allRows = includeExtras && extraRows.length > 0
    ? [...rows, { isBlank: true, id: 'extra_blank' }, ...extraRows]
    : rows;

  const handlePrint = () => {
    printDailyInventorySheet({
      systemItems,
      selectedDate,
      branch,
      address,
      preparedBy,
      checkedBy,
      includeExtras,
    });
  };

  const handleExportXlsx = () => {
    exportDailyInventoryXlsx({
      systemItems,
      selectedDate,
      branch,
      address,
      preparedBy,
      checkedBy,
      includeExtras,
    });
    setDownloadSuccess('Excel (.xlsx) file downloaded!');
    setTimeout(() => setDownloadSuccess(''), 3000);
  };



  return (
    <div className="print-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      <div className="print-modal-content" style={{
        backgroundColor: '#f8fafc',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}>
        {/* Modal Header / Action Toolbar */}
        <div className="print-modal-header no-print" style={{
          padding: '14px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: '#107c41',
              color: '#ffffff',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Daily Food Inventory — Excel Print & Export
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Matches official TAKOTIME store spreadsheet template
              </p>
            </div>
          </div>

          <div className="print-modal-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {downloadSuccess && (
              <span style={{
                color: 'var(--brand-green)',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <Check size={15} />
                {downloadSuccess}
              </span>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem' }}
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? 'Hide Settings' : 'Edit Header Info'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem', gap: '6px' }}
              onClick={handleExportXlsx}
              title="Download editable Microsoft Excel Workbook (.xlsx)"
            >
              <Download size={15} color="#107c41" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: '0.82rem', gap: '6px', backgroundColor: '#1B2A4A', borderColor: '#1B2A4A' }}
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '7px', minWidth: '32px' }}
              onClick={onClose}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Optional Header Config Drawer */}
        {showConfig && (
          <div className="no-print" style={{
            padding: '12px 20px',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                BRANCH NAME
              </label>
              <input
                type="text"
                className="input-field"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                BRANCH ADDRESS
              </label>
              <input
                type="text"
                className="input-field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                PREPARED BY
              </label>
              <input
                type="text"
                className="input-field"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                CHECKED BY
              </label>
              <input
                type="text"
                className="input-field"
                value={checkedBy}
                onChange={(e) => setCheckedBy(e.target.value)}
                placeholder="Manager / Supervisor"
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
              />
            </div>

            {extraRows.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                <input
                  type="checkbox"
                  id="includeExtrasCheck"
                  checked={includeExtras}
                  onChange={(e) => setIncludeExtras(e.target.checked)}
                />
                <label htmlFor="includeExtrasCheck" style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Include {extraRows.length} extra store items (cups, water, etc.)
                </label>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Preview Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: '#94a3b8' }}>
          {/* Printable Document Container */}
          <div
            id="daily-inventory-print-sheet"
            style={{
              width: '100%',
              maxWidth: '800px',
              backgroundColor: '#ffffff',
              padding: '24px 30px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
              color: '#000000',
              boxSizing: 'border-box',
            }}
          >
            {/* Title Section */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.2 }}>
                TAKOTIME
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.02em', marginTop: '2px' }}>
                DAILY FOOD INVENTORY
              </div>
            </div>

            {/* Header Meta Info */}
            <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.5 }}>
                <div>
                  <span style={{ fontWeight: 800 }}>BRANCH: </span>
                  <span style={{ textDecoration: 'none', marginLeft: '6px' }}>{branch}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 800 }}>DATE: </span>
                  <span style={{ marginLeft: '6px' }}>{selectedDate}</span>
                </div>
              </div>
              <div style={{ marginTop: '2px', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 800 }}>ADDRESS: </span>
                <span style={{ marginLeft: '6px' }}>{address}</span>
              </div>
            </div>

            {/* Main Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              tableLayout: 'fixed',
            }}>
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#1B2A4A', color: '#ffffff' }}>
                  <th style={{
                    border: '1px solid #1B2A4A',
                    padding: '6px 8px',
                    textAlign: 'left',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                  }}>
                    ITEM/FOOD
                  </th>
                  <th style={{
                    border: '1px solid #1B2A4A',
                    padding: '6px 6px',
                    textAlign: 'center',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                  }}>
                    STOCKS (NEW)
                  </th>
                  <th style={{
                    border: '1px solid #1B2A4A',
                    padding: '6px 6px',
                    textAlign: 'center',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                  }}>
                    IN
                  </th>
                  <th style={{
                    border: '1px solid #1B2A4A',
                    padding: '6px 6px',
                    textAlign: 'center',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                  }}>
                    OUT
                  </th>
                  <th style={{
                    border: '1px solid #1B2A4A',
                    padding: '6px 6px',
                    textAlign: 'center',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                  }}>
                    Ending
                  </th>
                  <th style={{
                    border: '1px solid #1B2A4A',
                    padding: '6px 6px',
                    textAlign: 'center',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                  }}>
                    DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((r, idx) => {
                  if (r.isBlank) {
                    return (
                      <tr key={`blank_${idx}`} style={{ height: '20px' }}>
                        <td style={{ border: '1px solid #d1d5db', padding: '4px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '4px' }}></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '4px' }}></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '4px' }}></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '4px' }}></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '4px' }}></td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={r.id || idx}>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '4px 8px',
                        fontWeight: r.isExtra ? 500 : 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {r.label}
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '4px 6px',
                        textAlign: 'right',
                        fontFamily: 'Consolas, monospace',
                        fontWeight: 600,
                      }}>
                        {r.stocksNew}
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '4px 6px',
                        textAlign: 'right',
                        fontFamily: 'Consolas, monospace',
                        fontWeight: 600,
                      }}>
                        {r.stockIn}
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '4px 6px',
                        textAlign: 'right',
                        fontFamily: 'Consolas, monospace',
                        fontWeight: 600,
                      }}>
                        {r.stockOut}
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '4px 6px',
                        textAlign: 'right',
                        fontFamily: 'Consolas, monospace',
                        fontWeight: 700,
                      }}>
                        {r.ending}
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '4px 6px',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                      }}>
                        {r.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer Signature Boxes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginTop: '16px',
            }}>
              <div style={{
                border: '1.5px solid #1B2A4A',
                borderRadius: '4px',
                minHeight: '52px',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1B2A4A' }}>
                  Prepared By:
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                  {preparedBy}
                </div>
              </div>

              <div style={{
                border: '1.5px solid #1B2A4A',
                borderRadius: '4px',
                minHeight: '52px',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1B2A4A' }}>
                  Checked By:
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                  {checkedBy}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
