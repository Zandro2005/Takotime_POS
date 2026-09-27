// renderer/router/RoleRouter.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/Login/LoginScreen';
import { LockScreen } from '../screens/LockScreen/LockScreen';
import { POSTerminal } from '../screens/staff/POSTerminal/POSTerminal';
import { AdminStaffShell } from '../screens/admin-staff/AdminStaffShell';
import { AdminShell } from '../screens/admin/AdminShell';
import { RemoteCloudShell } from '../screens/remote-admin/RemoteCloudShell';
import { ROLES } from '@shared/constants.js';

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
      CurrentScreen = <POSTerminal />;
      break;
    case ROLES.ADMIN_STAFF:
      CurrentScreen = <AdminStaffShell />;
      break;
    case ROLES.ADMIN:
      CurrentScreen = <AdminShell />;
      break;
    case ROLES.REMOTE_ADMIN:
      CurrentScreen = <RemoteCloudShell />;
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
