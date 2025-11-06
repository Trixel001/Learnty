import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const serializeError = (error: any) => {
  if (error instanceof Error) {
    return error.message + '\n' + error.stack;
  }
  return JSON.stringify(error, null, 2);
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-8 shadow-xl max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Application Error
              </h2>
              <p className="text-muted-foreground">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>
            
            {/* Error details for debugging */}
            <details className="text-left bg-muted rounded-lg p-4 mb-6 text-sm">
              <summary className="cursor-pointer font-medium text-foreground mb-2">
                Error Details (for debugging)
              </summary>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <pre className="whitespace-pre-wrap break-words text-xs text-red-800 overflow-auto max-h-64">
                  {serializeError(this.state.error)}
                </pre>
              </div>
            </details>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-muted text-foreground py-3 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}