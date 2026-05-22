import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// Erros causados por extensões do browser que modificam o DOM
const DOM_EXTENSION_ERRORS = [
  "removeChild",
  "insertBefore",
  "NotFoundError",
  "The node to be removed",
];

function isDomExtensionError(error: Error): boolean {
  const msg = error.message + (error.stack ?? "");
  return DOM_EXTENSION_ERRORS.some((s) => msg.includes(s));
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Para erros de extensão do browser, tentar recuperar automaticamente
    if (isDomExtensionError(error) && this.state.retryCount < 3) {
      this.retryTimer = setTimeout(() => {
        this.setState((s) => ({
          hasError: false,
          error: null,
          retryCount: s.retryCount + 1,
        }));
      }, 300);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  render() {
    if (this.state.hasError) {
      const isExtensionError = this.state.error
        ? isDomExtensionError(this.state.error)
        : false;

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-2">Ocorreu um erro inesperado</h2>

            {isExtensionError && (
              <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                Isso pode ser causado por uma extensão do navegador (tradução,
                gerenciador de senhas, etc.). Tente desativar as extensões ou
                recarregar a página.
              </p>
            )}

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg mt-4",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
