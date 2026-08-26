import React from 'react';
import { usePOS } from '../../context/POSContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const GlobalToast: React.FC = () => {
  const { toastNotification, clearToastNotification } = usePOS();

  if (!toastNotification) return null;

  const isError = toastNotification.type === 'error';
  const isSuccess = toastNotification.type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 text-white backdrop-blur-md ${
          isError
            ? 'bg-rose-950/95 border-rose-600/80 text-rose-50'
            : isSuccess
            ? 'bg-emerald-950/95 border-emerald-600/80 text-emerald-50'
            : 'bg-stone-900/95 border-stone-700 text-stone-100'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {!isError && !isSuccess && <Info className="w-5 h-5 text-amber-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black uppercase tracking-wider">
            {toastNotification.title}
          </h4>
          <p className="text-xs mt-0.5 text-stone-300 leading-relaxed font-medium break-words">
            {toastNotification.message}
          </p>
        </div>

        <button
          type="button"
          onClick={clearToastNotification}
          className="shrink-0 p-1 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
