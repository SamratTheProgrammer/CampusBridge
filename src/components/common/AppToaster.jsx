import React from 'react';
import { Toaster, resolveValue, toast } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Loader2, Info, X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

/**
 * ThemedToastItem
 * 
 * Custom popup toast component that automatically adapts to:
 * - Dark mode (rich dark glassmorphism)
 * - Light mode (crisp clean light glassmorphism)
 * - Event themes (subtle festive accents)
 * 
 * Features spring popup entrance and smooth dismissal animation.
 */
function ThemedToastItem({ toast: t }) {
  const { theme, globalTheme } = useTheme();

  // Determine icon styling based on toast type (without borders)
  let iconElement = null;

  if (t.icon) {
    iconElement = (
      <span className="text-xl flex-shrink-0 select-none leading-none">
        {t.icon}
      </span>
    );
  } else if (t.type === 'success') {
    iconElement = (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  } else if (t.type === 'error') {
    iconElement = (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  } else if (t.type === 'loading') {
    iconElement = (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
        <Loader2 className="w-5 h-5 stroke-[2.2] animate-spin" />
      </div>
    );
  } else {
    // Default / Info
    iconElement = (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
        <Info className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  return (
    <div
      {...t.ariaProps}
      className={`
        pointer-events-auto flex items-center gap-3.5 px-4.5 py-3.5 sm:px-5 sm:py-4
        min-w-[280px] max-w-[440px] rounded-2xl select-none border-0
        bg-card/95 text-card-foreground
        shadow-[0_20px_50px_rgba(0,0,0,0.16),0_8px_20px_-6px_rgba(0,0,0,0.1)]
        dark:shadow-[0_25px_65px_-10px_rgba(0,0,0,0.8),0_0_35px_rgba(0,0,0,0.35)]
        backdrop-blur-xl transition-all duration-200
        ${t.visible ? 'cb-toast-popup' : 'cb-toast-exit'}
      `}
      style={{
        ...t.style,
      }}
    >
      {/* Toast Icon */}
      {iconElement}

      {/* Toast Message */}
      <div className="flex-1 text-sm font-medium leading-snug tracking-tight break-words text-card-foreground">
        {resolveValue(t.message, t)}
      </div>

      {/* Dismiss / Close button */}
      {t.type !== 'loading' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="flex-shrink-0 p-1.5 -mr-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>
      )}
    </div>
  );
}

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={12}
      containerStyle={{
        top: 20,
        bottom: 20,
        right: 20,
        left: 20,
        zIndex: 99999,
      }}
      toastOptions={{
        duration: 3800,
      }}
    >
      {(t) => <ThemedToastItem toast={t} />}
    </Toaster>
  );
}
