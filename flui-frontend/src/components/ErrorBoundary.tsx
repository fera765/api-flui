import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page to reset the app state
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Oops! Algo deu errado</CardTitle>
                  <CardDescription>
                    Um erro inesperado ocorreu, mas não se preocupe - a aplicação continua funcionando
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="space-y-2">
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">
                      Mensagem de erro:
                    </p>
                    <p className="text-sm text-destructive/80 font-mono">
                      {this.state.error.message}
                    </p>
                  </div>

                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="p-4 bg-muted rounded-lg">
                      <summary className="text-sm font-medium cursor-pointer">
                        Detalhes técnicos (desenvolvimento)
                      </summary>
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-60">
                        {this.state.error.stack}
                        {'\n\n'}
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset} className="flex-1 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Aplicação
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="flex-1"
                >
                  Voltar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Se o problema persistir, entre em contato com o suporte
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
