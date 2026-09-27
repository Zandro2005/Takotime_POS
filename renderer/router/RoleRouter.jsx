// renderer/router/RoleRouter.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/Login/LoginScreen';
import { LockScreen } from '../screens/LockScreen/LockScreen';
import { POSTerminalShell } from '../screens/staff/POSTerminal/POSTerminalShell';
import { AdminStaffShell } from '../screens/admin-staff/AdminStaffShell';
import { AdminShell } from '../screens/admin/AdminShell';
import { ROLES } from '../../shared/constants';

export function RoleRouter() {
  const { user, isLocked, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-muted)'
      }}>
        Loading TAKOTIME POS...
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!user) {
    return <LoginScreen />;
  }

  // Pick screen by role
  let CurrentScreen = null;
  switch (user.role) {
    case ROLES.STAFF:
      CurrentScreen = <POSTerminalShell />;
      break;
    case ROLES.ADMIN_STAFF:
      CurrentScreen = <AdminStaffShell />;
      break;
    case ROLES.ADMIN:
      CurrentScreen = <AdminShell />;
      break;
    default:
      CurrentScreen = <LoginScreen />;
      break;
  }

  return (
    <>
      {CurrentScreen}
      {isLocked && <LockScreen />}
    </>
  );
}
