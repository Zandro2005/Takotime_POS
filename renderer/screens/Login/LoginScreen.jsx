// renderer/screens/Login/LoginScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Flame, Lock, User, KeyRound, ArrowRight, Delete } from 'lucide-react';
import './LoginScreen.css';

export function LoginScreen() {
  const { login, loginWithPin, error: authError } = useAuth();
  const [mode, setMode] = useState('pin'); // 'pin' or 'password'
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const error = localError || authError;

  const handleNumpadPress = async (digit) => {
    if (loading) return;
    setLocalError('');
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);

      // Auto-submit when 4 digits entered for fast store rush flow
      if (nextPin.length === 4) {
        setLoading(true);
        try {
          await loginWithPin(nextPin);
        } catch (err) {
          setLocalError(err.message || 'Invalid PIN');
          setPin('');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleClearPin = () => {
    setPin('');
    setLocalError('');
  };

  const handleDeleteDigit = () => {
    setPin(prev => prev.slice(0, -1));
    setLocalError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setLocalError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setLocalError('');
    try {
      await login(username.trim(), password);
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoType) => {
    if (demoType === 'staff') {
      setMode('pin');
      setPin('1111');
      handleNumpadPress(''); // triggers or quick-fills
      loginWithPin('1111').catch(e => setLocalError(e.message));
    } else if (demoType === 'supervisor') {
      setMode('pin');
      setPin('5678');
      loginWithPin('5678').catch(e => setLocalError(e.message));
    } else if (demoType === 'admin') {
      setMode('password');
      setUsername('admin');
      setPassword('admin123');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="brand-icon-wrapper">
            <Flame size={36} strokeWidth={2.5} />
          </div>
          <h1 className="brand-title">TAKOTIME</h1>
          <p className="brand-subtitle">Branch: Montalban • Point of Sale</p>
        </div>

        {/* Toggle Mode */}
        <div className="auth-toggle">
          <button
            type="button"
            className={`auth-toggle-btn ${mode === 'pin' ? 'active' : ''}`}
            onClick={() => { setMode('pin'); setLocalError(''); setPin(''); }}
          >
            Staff Quick PIN
          </button>
          <button
            type="button"
            className={`auth-toggle-btn ${mode === 'password' ? 'active' : ''}`}
            onClick={() => { setMode('password'); setLocalError(''); }}
          >
            Manager Password
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* Mode: PIN Keypad */}
        {mode === 'pin' ? (
          <div className="pin-mode-wrapper">
            <div className="pin-display-container">
              <div className="pin-dots">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`pin-dot ${idx < pin.length ? 'filled' : ''}`}
                  />
                ))}
              </div>
            </div>

            <div className="numpad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="numpad-btn"
                  onClick={() => handleNumpadPress(num.toString())}
                  disabled={loading}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="numpad-btn action"
                onClick={handleClearPin}
                disabled={loading || pin.length === 0}
              >
                C
              </button>
              <button
                type="button"
                className="numpad-btn"
                onClick={() => handleNumpadPress('0')}
                disabled={loading}
              >
                0
              </button>
              <button
                type="button"
                className="numpad-btn action"
                onClick={handleDeleteDigit}
                disabled={loading || pin.length === 0}
              >
                <Delete size={22} />
              </button>
            </div>
          </div>
        ) : (
          /* Mode: Username & Password Form */
          <form className="login-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. admin or supervisor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '14px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Demo Fast Access Pills for Developer / Owner Testing */}
        <div className="demo-accounts">
          <div className="demo-title">Quick Demo Login</div>
          <div className="demo-pills">
            <button type="button" className="demo-pill" onClick={() => fillDemo('staff')}>
              Staff (PIN: 1111)
            </button>
            <button type="button" className="demo-pill" onClick={() => fillDemo('supervisor')}>
              Lead Staff (PIN: 5678)
            </button>
            <button type="button" className="demo-pill" onClick={() => fillDemo('admin')}>
              Admin (admin / admin123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
