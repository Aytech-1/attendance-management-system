'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[UNCAUGHT UI ERROR]', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Something went wrong
            </h2>
            <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#004B29] hover:bg-[#003C1F] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-md flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
