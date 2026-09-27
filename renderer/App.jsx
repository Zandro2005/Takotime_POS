// renderer/App.jsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { RoleRouter } from './router/RoleRouter';

export default function App() {
  return (
    <AuthProvider>
      <RoleRouter />
    </AuthProvider>
  );
}
