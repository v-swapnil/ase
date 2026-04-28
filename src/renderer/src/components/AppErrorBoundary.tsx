import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unexpected UI error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AppErrorBoundary', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex h-full items-center justify-center bg-ink-950 p-8 text-ink-100">
        <div className="w-full max-w-2xl rounded border border-rose-800/60 bg-ink-900/70 p-6">
          <div className="font-mono text-ui-xs uppercase tracking-widest2 text-rose-300">
            renderer error boundary
          </div>
          <h1 className="mt-2 font-serif text-3xl text-ink-50">Something crashed in the UI</h1>
          <p className="mt-3 font-mono text-ui-base text-ink-300">{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded border border-ink-700 px-3 py-1.5 font-mono text-ui-sm uppercase tracking-widest2 text-ink-100 hover:border-ink-600"
          >
            reload app
          </button>
        </div>
      </div>
    );
  }
}
