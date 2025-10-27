import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold mb-2">
              Algo deu errado
            </AlertTitle>
            <AlertDescription className="space-y-4">
              <p className="text-sm">
                Ocorreu um erro inesperado. A aplica\u00e7\u00e3o continua funcional,
                mas este componente pode n\u00e3o estar funcionando corretamente.
              </p>
              {this.state.error && (
                <details className="text-xs bg-black/10 p-2 rounded">
                  <summary className="cursor-pointer font-medium">
                    Detalhes do erro
                  </summary>
                  <pre className="mt-2 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
