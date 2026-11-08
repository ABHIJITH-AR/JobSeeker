import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 0;

const styles = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-800',
    icon: AlertCircle,
    iconClass: 'text-red-600',
  },
  info: {
    wrapper: 'border-blue-200 bg-skysoft text-navy',
    icon: Info,
    iconClass: 'text-brand',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message, type = 'success') => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (message) => pushToast(message, 'success'),
      error: (message) => pushToast(message, 'error'),
      info: (message) => pushToast(message, 'info'),
      show: pushToast,
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((item) => {
          const style = styles[item.type] || styles.info;
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-cardHover animate-toast-in ${style.wrapper}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
              <p className="flex-1 text-sm font-medium leading-5">{item.message}</p>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="rounded p-0.5 opacity-70 transition hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export default ToastContext;
