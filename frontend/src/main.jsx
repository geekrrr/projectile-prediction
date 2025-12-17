import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import './styles.css'

// Error boundary for the entire app
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '600px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            color: 'white',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '700' }}>
              🚨 Application Error
            </h1>
            <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '24px' }}>
              Something went wrong. Please refresh the page or contact support.
            </p>
            <details style={{ 
              textAlign: 'left', 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '16px', 
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                Error Details
              </summary>
              <pre style={{ 
                fontSize: '14px', 
                overflow: 'auto', 
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Initialize app
const root = createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

// Log app version (only in development)
if (import.meta.env.DEV) {
  console.log(
    '%c🚀 Ballistic Studio v1.0.0',
    'color: #764ba2; font-size: 16px; font-weight: bold; padding: 10px;'
  )

  console.log(
    '%cDeveloped by Group 1 - CSVTU',
    'color: #667eea; font-size: 12px; padding: 5px;'
  )
}

// Performance monitoring (development only)
if (import.meta.env.DEV) {
  console.log('%c⚡ Development Mode Active', 'color: #f093fb; font-size: 12px;')
  
  // Log performance metrics
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0]
      if (perfData) {
        console.log(
          `%c📊 Performance: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`,
          'color: #667eea; font-size: 12px;'
        )
      }
    }, 0)
  })
}

// Service worker registration (for production PWA)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration.scope)
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error)
      })
  })
}