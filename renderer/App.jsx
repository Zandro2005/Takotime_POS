import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import { RoleRouter } from './router/RoleRouter';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary title="TAKOTIME POS Error" message="An unexpected error occurred in the application.">
      <AuthProvider>
        <ShiftProvider>
          <RoleRouter />
        </ShiftProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
