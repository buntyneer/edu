import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center h-screen bg-slate-100 p-4">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-800">Something went wrong.</h1>
                <p className="text-slate-600 mt-2 mb-6">An unexpected error occurred. Please try again.</p>
                <Button onClick={() => window.location.reload()}>
                    Refresh Page
                </Button>
            </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;