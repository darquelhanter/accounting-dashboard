import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';

export type AlertType = 'atrasado' | 'proximo' | 'pendente';

interface AlertBadgeProps {
  type: AlertType;
  label: string;
  className?: string;
}

export function AlertBadge({ type, label, className = '' }: AlertBadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium';
  
  const typeClasses = {
    atrasado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    proximo: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    pendente: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  const icons = {
    atrasado: <AlertCircle className="w-3.5 h-3.5" />,
    proximo: <Clock className="w-3.5 h-3.5" />,
    pendente: <AlertTriangle className="w-3.5 h-3.5" />,
  };

  return (
    <span className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {icons[type]}
      {label}
    </span>
  );
}

interface AlertRowProps {
  type: AlertType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AlertRow({ type, title, subtitle, action }: AlertRowProps) {
  const bgClasses = {
    atrasado: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    proximo: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
    pendente: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  };

  const textClasses = {
    atrasado: 'text-red-900 dark:text-red-100',
    proximo: 'text-amber-900 dark:text-amber-100',
    pendente: 'text-blue-900 dark:text-blue-100',
  };

  const icons = {
    atrasado: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    proximo: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    pendente: <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${bgClasses[type]}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${textClasses[type]}`}>{title}</p>
        {subtitle && (
          <p className={`text-sm mt-1 opacity-90 ${textClasses[type]}`}>{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface AlertBannerProps {
  type: AlertType;
  title: string;
  description?: string;
  onClose?: () => void;
}

export function AlertBanner({ type, title, description, onClose }: AlertBannerProps) {
  const bgClasses = {
    atrasado: 'bg-red-600 dark:bg-red-700',
    proximo: 'bg-amber-600 dark:bg-amber-700',
    pendente: 'bg-blue-600 dark:bg-blue-700',
  };

  const icons = {
    atrasado: <AlertCircle className="w-5 h-5" />,
    proximo: <Clock className="w-5 h-5" />,
    pendente: <AlertTriangle className="w-5 h-5" />,
  };

  return (
    <div className={`${bgClasses[type]} text-white rounded-lg p-4 flex items-start gap-3`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm mt-1 opacity-90">{description}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white hover:opacity-80 transition-opacity"
          aria-label="Fechar alerta"
        >
          <span className="text-xl leading-none">×</span>
        </button>
      )}
    </div>
  );
}

interface AlertIndicatorProps {
  count: number;
  type: AlertType;
  label: string;
}

export function AlertIndicator({ count, type, label }: AlertIndicatorProps) {
  if (count === 0) return null;

  const bgClasses = {
    atrasado: 'bg-red-500 dark:bg-red-600',
    proximo: 'bg-amber-500 dark:bg-amber-600',
    pendente: 'bg-blue-500 dark:bg-blue-600',
  };

  return (
    <div className={`${bgClasses[type]} text-white rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1.5`}>
      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
      {count} {label}
    </div>
  );
}
