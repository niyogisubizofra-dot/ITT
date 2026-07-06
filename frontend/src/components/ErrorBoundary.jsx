import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/40 p-8">
          <div className="max-w-md text-center bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-500 text-3xl font-black">!</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">Something went wrong</h2>
            <p className="text-slate-500 font-medium mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-600 font-medium">Error details</summary>
                <pre className="mt-2 text-xs text-red-500 bg-red-50 p-3 rounded-xl overflow-auto max-h-32 border border-red-100">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
