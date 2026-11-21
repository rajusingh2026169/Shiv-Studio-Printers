import React from 'react';
import { FirestoreErrorInfo } from '../firebase';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  firestoreErrorInfo: FirestoreErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState;
  declare readonly props: Readonly<{ children: React.ReactNode }>;
  declare setState: (
    state: Partial<ErrorBoundaryState> | ((prevState: ErrorBoundaryState) => Partial<ErrorBoundaryState>)
  ) => void;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      firestoreErrorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let parsedInfo: FirestoreErrorInfo | null = null;
    try {
      if (error.message && error.message.trim().startsWith('{')) {
        const candidate = JSON.parse(error.message);
        if (candidate && typeof candidate === 'object' && 'operationType' in candidate && 'error' in candidate) {
          parsedInfo = candidate as FirestoreErrorInfo;
        }
      }
    } catch {
      parsedInfo = null;
    }

    return {
      hasError: true,
      error,
      firestoreErrorInfo: parsedInfo
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      firestoreErrorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const fsInfo = this.state.firestoreErrorInfo;
      const friendlyMessage = fsInfo
        ? 'You do not have permission to access or update that studio record with the current account.'
        : this.state.error?.message || 'An unexpected application error occurred.';

      return (
        <div className="bg-[#111111] min-h-screen text-white flex items-center justify-center px-4 py-12 font-sans">
          <div className="max-w-lg w-full bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
                SHIV STUDIO • Session Protection
              </p>
              <h2 className="font-serif text-2xl font-semibold text-white">
                Something Interrupted This View
              </h2>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {friendlyMessage}
              </p>
            </div>

            {fsInfo && (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-3 text-left font-mono text-[11px] text-neutral-400 space-y-1">
                <div>Operation: <span className="text-[#D4AF37]">{fsInfo.operationType}</span></div>
                {fsInfo.path && <div>Collection/Path: <span className="text-neutral-200">{fsInfo.path}</span></div>}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e3be42] text-[#111111] font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <a
                href="/"
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-2 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Return Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
