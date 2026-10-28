import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-gray-500 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-forest mb-3" />
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}

interface ErrorProps {
  message?: string;
  retry?: () => void;
}

export function ErrorMessage({ message, retry }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-red-600">
      <p className="font-medium mb-2">Something went wrong</p>
      <p className="text-sm text-gray-500 mb-4">{message || 'Please try again.'}</p>
      {retry && (
        <button onClick={retry} className="btn-secondary text-sm">
          Try Again
        </button>
      )}
    </div>
  );
}

interface EmptyProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">🍽</div>
      <h3 className="font-semibold text-gray-800 text-lg mb-1">{title || 'Nothing here yet'}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">{description || 'Check back later or create the first one.'}</p>
      {action}
    </div>
  );
}
