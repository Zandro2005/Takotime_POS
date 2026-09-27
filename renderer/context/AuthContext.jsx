// renderer/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState(null);

  const inactivityTimerRef = useRef(null);
  const timeoutMinutes = 30; // Auto-lock after 30 minutes of inactivity

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (user && !isLocked) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsLocked(true);
      }, timeoutMinutes * 60 * 1000);
    }
  }, [user, isLocked]);

  // Listen to user interactions to reset timer
  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetInactivityTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  // Initial load check
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      if (!window.api?.auth?.login) {
        throw new Error('Desktop bridge not available');
      }

      const res = await window.api.auth.login(username, password);
      if (!res.success) {
        throw new Error(res.error || 'Login failed');
      }

      setUser(res.data.user);
      setSessionId(res.data.sessionId);
      setIsLocked(false);
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithPin = async (pin) => {
    setError(null);
    try {
      if (!window.api?.auth?.loginWithPin) {
        throw new Error('Desktop bridge not available');
      }

      const res = await window.api.auth.loginWithPin(pin);
      if (!res.success) {
        throw new Error(res.error || 'PIN login failed');
      }

      setUser(res.data.user);
      setSessionId(res.data.sessionId);
      setIsLocked(false);
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const unlockWithPin = async (pin) => {
    try {
      const res = await window.api.auth.loginWithPin(pin);
      if (!res.success) throw new Error(res.error || 'Incorrect PIN');
      // If the unlocked user is the same or authorized
      setUser(res.data.user);
      setSessionId(res.data.sessionId);
      setIsLocked(false);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (window.api?.auth?.logout && sessionId) {
        await window.api.auth.logout(sessionId);
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      setSessionId(null);
      setIsLocked(false);
      setError(null);
    }
  };

  const lockScreen = () => {
    setIsLocked(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionId,
        isLoading,
        isLocked,
        error,
        login,
        loginWithPin,
        unlockWithPin,
        logout,
        lockScreen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
