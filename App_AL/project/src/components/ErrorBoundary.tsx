import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#003366] flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Algo salió mal
            </h1>

            <p className="text-gray-600 text-center mb-6">
              La aplicación encontró un error inesperado. Por favor, intenta recargar la página.
            </p>

            {this.state.error && (
              <div className="bg-gray-50 rounded p-4 mb-6 max-h-48 overflow-auto">
                <p className="text-xs text-gray-700 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full bg-[#003366] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#004080] transition-colors"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
