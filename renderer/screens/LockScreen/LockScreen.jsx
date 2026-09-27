// renderer/screens/LockScreen/LockScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Delete, LogOut } from 'lucide-react';
import './LockScreen.css';

export function LockScreen() {
  const { user, unlockWithPin, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumpad = async (digit) => {
    if (loading) return;
    setError('');
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        setLoading(true);
        try {
          await unlockWithPin(nextPin);
        } catch (err) {
          setError(err.message || 'Incorrect PIN');
          setPin('');
        } finally {
          setLoading(false);
        }
      }
    }
  };

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
