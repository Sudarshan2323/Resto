import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 3000); // Remove toast after 3 seconds
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// --- Sub-components to keep it in one file for simplicity ---

interface ToastProps {
  message: string;
  type: ToastType;
}

const Toast: React.FC<ToastProps> = ({ message, type }) => {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const colors = {
        success: 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700',
        error: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700',
        info: 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700',
    }

    return (
        <div className={`flex items-center p-4 mb-4 text-sm text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border ${colors[type]} animate-fade-in-down`}>
            {icons[type]}
            <div className="ml-3 font-medium">{message}</div>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
    return (
        <div className="fixed top-5 right-5 z-[100] w-full max-w-xs">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast.message} type={toast.type} />
            ))}
        </div>
    );
};
