import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Component } from 'react'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('React ErrorBoundary caught:', error, info)
    this.setState({ error, info })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '24px',
          margin: '24px',
          fontFamily: 'monospace',
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          color: '#991b1b',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            ⚠️ Page Error
          </h2>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {this.state.error?.message || String(this.state.error)}
          </p>
          <pre style={{
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            background: '#fff',
            padding: '12px',
            borderRadius: '4px',
            marginTop: '8px',
            maxHeight: '300px',
            overflow: 'auto',
          }}>
            {this.state.error?.stack || 'No stack trace'}
          </pre>
          <button
            onClick={() => { this.setState({ error: null, info: null }); window.location.reload() }}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
