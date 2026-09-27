// renderer/context/ShiftContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const { user, sessionId } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [isLoadingShift, setIsLoadingShift] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const fetchCurrentShift = useCallback(async () => {
    if (!sessionId || !user) {
      setCurrentShift(null);
      return;
    }

    setIsLoadingShift(true);
    try {
      if (window.api?.shifts?.getCurrent) {
        const res = await window.api.shifts.getCurrent(sessionId);
        if (res.success && res.data) {
          setCurrentShift(res.data);
          setShowOpenModal(false);
        } else {
          setCurrentShift(null);
          // If staff is logged in and has no open shift, prompt open modal
          setShowOpenModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch shift:', err);
    } finally {
      setIsLoadingShift(false);
    }
  }, [sessionId, user]);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  const openShift = async (startingCash, notes = '') => {
    try {
      const res = await window.api.shifts.open(sessionId, startingCash, notes);
      if (!res.success) throw new Error(res.error || 'Failed to open shift');
      setCurrentShift(res.data);
      setShowOpenModal(false);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const closeShift = async (endingCash, notes = '') => {
    if (!currentShift) throw new Error('No active shift to close');
    try {
      const res = await window.api.shifts.close(sessionId, currentShift.id, endingCash, notes);
      if (!res.success) throw new Error(res.error || 'Failed to close shift');
      setCurrentShift(null);
      setShowCloseModal(false);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        currentShift,
        isLoadingShift,
        showOpenModal,
        setShowOpenModal,
        showCloseModal,
        setShowCloseModal,
        openShift,
        closeShift,
        refreshShift: fetchCurrentShift,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
