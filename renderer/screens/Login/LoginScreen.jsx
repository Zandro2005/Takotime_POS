import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, KeyRound, ArrowRight, Delete, Eye, EyeOff } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import './LoginScreen.css';

export function LoginScreen() {
  const { login, loginWithPin, error: authError } = useAuth();
  const [mode, setMode] = useState('pin'); // 'pin' or 'password'
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const pinRef = useRef(pin);
  pinRef.current = pin;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const error = localError || authError;

  const handleNumpadPress = async (digit) => {
    if (loadingRef.current) return;
    setLocalError('');
    const currentPin = pinRef.current;
    if (currentPin.length < 6) {
      const nextPin = currentPin + digit;
      pinRef.current = nextPin;
      setPin(nextPin);

      // Auto-submit when 4 digits entered for fast store rush flow
      if (nextPin.length === 4) {
        setLoading(true);
        loadingRef.current = true;
        try {
          await loginWithPin(nextPin);
        } catch (err) {
          setLocalError(err.message || 'Invalid PIN');
          pinRef.current = '';
          setPin('');
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    }
  };

  const handleClearPin = () => {
    pinRef.current = '';
    setPin('');
    setLocalError('');
  };

  const handleDeleteDigit = () => {
    pinRef.current = pinRef.current.slice(0, -1);
    setPin(pinRef.current);
    setLocalError('');
  };

  // Enable physical keyboard entry for quick PIN mode (0-9, Backspace, Escape/C, Enter)
  useEffect(() => {
    if (mode !== 'pin') return;

    const handleKeyDown = (e) => {
      // Don't intercept if an input element or modal input is focused
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumpadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteDigit();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClearPin();
      } else if (e.key === 'Enter') {
        if (pinRef.current.length >= 4 && !loadingRef.current) {
          e.preventDefault();
          setLoading(true);
          loadingRef.current = true;
          loginWithPin(pinRef.current)
            .catch(err => {
              setLocalError(err.message || 'Invalid PIN');
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
  }, [mode]);

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

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        {/* Header */}
        <div className="login-header">
          <img src={logoImg} alt="TAKOTIME Logo" className="brand-logo-img" />
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
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
      </div>
    </div>
  );
}
