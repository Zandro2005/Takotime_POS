import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Delete, LogOut } from 'lucide-react';
import './LockScreen.css';

export function LockScreen() {
  const { user, unlockWithPin, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pinRef = useRef(pin);
  pinRef.current = pin;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const handleNumpad = async (digit) => {
    if (loadingRef.current) return;
    setError('');
    const currentPin = pinRef.current;
    if (currentPin.length < 6) {
      const nextPin = currentPin + digit;
      pinRef.current = nextPin;
      setPin(nextPin);

      if (nextPin.length === 4) {
        setLoading(true);
        loadingRef.current = true;
        try {
          await unlockWithPin(nextPin);
        } catch (err) {
          setError(err.message || 'Incorrect PIN');
          pinRef.current = '';
          setPin('');
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    }
  };

  const handleClear = () => {
    pinRef.current = '';
    setPin('');
    setError('');
  };

  const handleDelete = () => {
    pinRef.current = pinRef.current.slice(0, -1);
    setPin(pinRef.current);
    setError('');
  };

  // Keyboard support for unlocking terminal (0-9, Backspace, Escape/C, Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumpad(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        if (pinRef.current.length >= 4 && !loadingRef.current) {
          e.preventDefault();
          setLoading(true);
          loadingRef.current = true;
          unlockWithPin(pinRef.current)
            .catch(err => {
              setError(err.message || 'Incorrect PIN');
              pinRef.current = '';
              setPin('');
            })
            .finally(() => {
              setLoading(false);
              loadingRef.current = false;
            });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="lockscreen-overlay animate-fade-in">
      <div className="lockscreen-card">
        <div className="lock-user-avatar">
          <Lock size={30} />
        </div>

        <div>
          <div className="lock-user-name">{user?.name || 'Session Locked'}</div>
          <div className="lock-user-role">Role: {user?.role?.replace('_', ' ')}</div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Terminal locked due to inactivity. Enter PIN to resume.
        </p>

        {error && <div className="error-banner" style={{ width: '100%' }}>{error}</div>}

        <div className="pin-dots">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`pin-dot ${idx < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        <div className="numpad-grid" style={{ width: '100%' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="numpad-btn"
              onClick={() => handleNumpad(num.toString())}
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="numpad-btn action"
            onClick={() => setPin('')}
            disabled={loading}
          >
            C
          </button>
          <button
            type="button"
            className="numpad-btn"
            onClick={() => handleNumpad('0')}
            disabled={loading}
          >
            0
          </button>
          <button
            type="button"
            className="numpad-btn action"
            onClick={() => setPin(prev => prev.slice(0, -1))}
            disabled={loading}
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '4px' }}
          onClick={logout}
        >
          <LogOut size={16} />
          Switch User / Sign Out
        </button>
      </div>
    </div>
  );
}
