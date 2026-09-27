// renderer/components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          padding: '40px 24px',
          backgroundColor: 'var(--bg-app)',
          textAlign: 'center',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={28} color="var(--brand-danger)" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {this.props.title || 'Something went wrong'}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
              {this.props.message || 'An unexpected error occurred while displaying this section.'}
            </p>

            {this.state.error?.message && (
              <pre style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                textAlign: 'left',
                margin: 0,
                fontFamily: 'var(--font-mono)',
              }}>
                {this.state.error.message}
              </pre>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '8px', padding: '10px 20px', gap: '8px' }}
              onClick={this.handleReset}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
