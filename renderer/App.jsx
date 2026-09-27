// renderer/App.jsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import { RoleRouter } from './router/RoleRouter';

export default function App() {
  return (
    <AuthProvider>
      <ShiftProvider>
        <RoleRouter />
      </ShiftProvider>
    </AuthProvider>
  );
}
