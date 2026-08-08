import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-card border border-border/50 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-6">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred while loading this page. Don't worry, your data is safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-muted/50 rounded-xl text-xs font-mono text-muted-foreground overflow-x-auto text-left border border-border/40 max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
