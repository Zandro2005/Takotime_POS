// renderer/screens/admin/Staff/StaffManagement.jsx
// Management screen for staff accounts, role assignments, quick PINs, and password administration.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Lock,
  UserCheck,
  UserX,
  RefreshCw,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';
import { ROLES } from '../../../../shared/constants';

export function StaffManagement() {
  const { sessionId, user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, staff: null });
  const [passwordModal, setPasswordModal] = useState({ open: false, staff: null, newPassword: '' });
  const [pinModal, setPinModal] = useState({ open: false, staff: null, newPin: '' });

  // Add form fields
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState(ROLES.STAFF);
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPass, setShowPass] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      if (window.api?.staff?.list) {
        const res = await window.api.staff.list(sessionId);
        if (res.success && res.data) {
          setStaffList(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [sessionId]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newPassword) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      if (window.api?.staff?.create) {
        const res = await window.api.staff.create(sessionId, {
          name: newName,
          username: newUsername,
          role: newRole,
          password: newPassword,
          pin: newPin || null,
        });

        if (res.success) {
          showToast(`Account for ${newName} created successfully!`);
          setAddModal(false);
          setNewName('');
          setNewUsername('');
          setNewRole(ROLES.STAFF);
          setNewPassword('');
          setNewPin('');
          await loadStaff();
        } else {
          alert('Error creating staff: ' + (res.error || 'Failed'));
        }
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editModal.staff) return;

    try {
      if (window.api?.staff?.update) {
        const res = await window.api.staff.update(sessionId, {
          id: editModal.staff.id,
          name: editModal.staff.name,
          role: editModal.staff.role,
          active: editModal.staff.active,
        });

        if (res.success) {
          showToast('Staff profile updated');
          setEditModal({ open: false, staff: null });
          await loadStaff();
        } else {
          alert('Update error: ' + (res.error || 'Failed'));
        }
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggleActive = async (staff) => {
    const isActivating = staff.active === 0;
    const confirmMsg = isActivating
      ? `Reactivate account for ${staff.name}?`
      : `Deactivate account for ${staff.name}? They will no longer be able to log in.`;

    if (!confirm(confirmMsg)) return;

    try {
      if (isActivating && window.api?.staff?.reactivate) {
        const res = await window.api.staff.reactivate(sessionId, staff.id);
        if (res.success) {
          showToast(`Account for ${staff.name} reactivated`);
          await loadStaff();
        } else {
          alert(res.error || 'Failed to reactivate');
        }
      } else if (!isActivating && window.api?.staff?.deactivate) {
        const res = await window.api.staff.deactivate(sessionId, staff.id);
        if (res.success) {
          showToast(`Account for ${staff.name} deactivated`);
          await loadStaff();
        } else {
          alert(res.error || 'Failed to deactivate');
        }
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordModal.newPassword || passwordModal.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      if (window.api?.staff?.resetPassword) {
        const res = await window.api.staff.resetPassword(sessionId, passwordModal.staff.id, passwordModal.newPassword);
        if (res.success) {
          showToast(`Password updated for ${passwordModal.staff.name}`);
          setPasswordModal({ open: false, staff: null, newPassword: '' });
        } else {
          alert('Error: ' + (res.error || 'Failed'));
        }
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    if (pinModal.newPin && !/^\d{4,6}$/.test(pinModal.newPin)) {
      alert('PIN must be 4 to 6 numeric digits (or empty to clear)');
      return;
    }

    try {
      if (window.api?.staff?.resetPin) {
        const res = await window.api.staff.resetPin(sessionId, pinModal.staff.id, pinModal.newPin || null);
        if (res.success) {
          showToast(pinModal.newPin ? `PIN updated for ${pinModal.staff.name}` : `PIN cleared for ${pinModal.staff.name}`);
          setPinModal({ open: false, staff: null, newPin: '' });
          await loadStaff();
        } else {
          alert('Error: ' + (res.error || 'Failed'));
        }
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return <span className="badge badge-admin">Store Admin</span>;
      case ROLES.ADMIN_STAFF:
        return <span className="badge badge-admin-staff">Lead Staff</span>;
      default:
        return <span className="badge badge-staff">Cashier</span>;
    }
  };

  return (
    <div className="responsive-page-container" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Staff & Cashier Accounts
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
            onClick={loadStaff}
            style={{ padding: '9px 14px' }}
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}
          >
            <UserPlus size={16} />
            + Add Staff Account
          </button>
        </div>
      </div>

      {/* Staff Table Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Staff Directory
            </h2>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Total Accounts: {staffList.length}
          </span>
        </div>

        <div className="responsive-table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                <th style={{ padding: '14px 20px' }}>STAFF MEMBER</th>
                <th style={{ padding: '14px 20px' }}>USERNAME</th>
                <th style={{ padding: '14px 20px' }}>ASSIGNED ROLE</th>
                <th style={{ padding: '14px 20px' }}>QUICK PIN</th>
                <th style={{ padding: '14px 20px' }}>STATUS</th>
                <th style={{ padding: '14px 20px' }}>SHIFT HISTORY</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <tr key={member.id} style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  opacity: member.active ? 1 : 0.6,
                  backgroundColor: member.active ? '#ffffff' : '#f8fafc',
                }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {member.name}
                    </div>
                    {member.id === currentUser?.id && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--brand-red)', fontWeight: 700 }}>
                        (You / Current Session)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    @{member.username}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {getRoleBadge(member.role)}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {member.has_pin ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--brand-green)',
                        backgroundColor: 'var(--brand-green-light)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <CheckCircle2 size={13} />
                        PIN Enabled
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        No PIN
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {member.active ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--brand-green)',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />
                        Active
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--brand-red)',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-red)' }} />
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div><strong>{member.total_shifts || 0}</strong> shifts completed</div>
                    {member.last_shift_at && (
                      <div style={{ fontSize: '0.72rem' }}>
                        Last: {new Date(member.last_shift_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {/* Edit Button */}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => setEditModal({ open: true, staff: { ...member } })}
                      >
                        Edit
                      </button>

                      {/* Reset Password Button */}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Reset Password"
                        onClick={() => setPasswordModal({ open: true, staff: member, newPassword: '' })}
                      >
                        <Lock size={13} style={{ marginRight: '4px' }} />
                        Pass
                      </button>

                      {/* Reset PIN Button */}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Set or Clear PIN"
                        onClick={() => setPinModal({ open: true, staff: member, newPin: '' })}
                      >
                        <Hash size={13} style={{ marginRight: '4px' }} />
                        PIN
                      </button>

                      {/* Deactivate/Reactivate */}
                      {member.active ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--brand-red)' }}
                          title="Deactivate Account"
                          onClick={() => handleToggleActive(member)}
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--brand-green)' }}
                          title="Reactivate Account"
                          onClick={() => handleToggleActive(member)}
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Staff */}
      {addModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--brand-red)" />
                Create Staff Account
              </h3>
              <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Maria Santos"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Username * (for login)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. msantos"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Role & Permissions *
                </label>
                <select
                  className="input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value={ROLES.STAFF}>Cashier (Staff) — Order taking & cash drawer only</option>
                  <option value={ROLES.ADMIN_STAFF}>Lead Staff (Supervisor) — Inventory ledger, reports & voids</option>
                  <option value={ROLES.ADMIN}>Store Admin — Full access to settings, staff & catalog</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Password * (minimum 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter secure initial password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Quick PIN (Optional, 4-6 digits for fast POS keypad login)
                </label>
                <input
                  type="password"
                  className="input"
                  maxLength={6}
                  placeholder="e.g. 1234"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} />
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Staff */}
      {editModal.open && editModal.staff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Edit Account: @{editModal.staff.username}
              </h3>
              <button type="button" className="btn btn-secondary" onClick={() => setEditModal({ open: false, staff: null })} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={editModal.staff.name}
                  onChange={(e) => setEditModal({ ...editModal, staff: { ...editModal.staff, name: e.target.value } })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Role & Permissions
                </label>
                <select
                  className="input"
                  value={editModal.staff.role}
                  onChange={(e) => setEditModal({ ...editModal, staff: { ...editModal.staff, role: e.target.value } })}
                >
                  <option value={ROLES.STAFF}>Cashier (Staff)</option>
                  <option value={ROLES.ADMIN_STAFF}>Lead Staff (Supervisor)</option>
                  <option value={ROLES.ADMIN}>Store Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={Boolean(editModal.staff.active)}
                  onChange={(e) => setEditModal({ ...editModal, staff: { ...editModal.staff, active: e.target.checked ? 1 : 0 } })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="activeCheck" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                  Account Active (Able to sign in)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal({ open: false, staff: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password */}
      {passwordModal.open && passwordModal.staff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '440px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="var(--brand-red)" />
                Reset Password: {passwordModal.staff.name}
              </h3>
              <button type="button" className="btn btn-secondary" onClick={() => setPasswordModal({ open: false, staff: null, newPassword: '' })} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter new password"
                  value={passwordModal.newPassword}
                  onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPasswordModal({ open: false, staff: null, newPassword: '' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Reset PIN */}
      {pinModal.open && pinModal.staff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '440px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={18} color="var(--brand-gold)" />
                Set Quick PIN: {pinModal.staff.name}
              </h3>
              <button type="button" className="btn btn-secondary" onClick={() => setPinModal({ open: false, staff: null, newPin: '' })} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPin} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  4 to 6 Digit PIN (leave empty to remove PIN)
                </label>
                <input
                  type="password"
                  className="input"
                  maxLength={6}
                  placeholder="e.g. 5678"
                  value={pinModal.newPin}
                  onChange={(e) => setPinModal({ ...pinModal, newPin: e.target.value.replace(/\D/g, '') })}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPinModal({ open: false, staff: null, newPin: '' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
