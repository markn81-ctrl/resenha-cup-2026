"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type NavigationFeedbackContextValue = {
  startNavigation: () => void;
};

const NavigationFeedbackContext = createContext<NavigationFeedbackContextValue | null>(null);

export function NavigationFeedbackProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const startNavigation = useCallback(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const fallback = window.setTimeout(() => setLoading(false), 12_000);
    return () => window.clearTimeout(fallback);
  }, [loading]);

  const value = useMemo(() => ({ startNavigation }), [startNavigation]);

  return (
    <NavigationFeedbackContext.Provider value={value}>
      {children}
      {loading ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="Carregando pagina"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm"
        >
          <div className="glass flex min-w-44 flex-col items-center rounded-[22px] px-7 py-6 text-center">
            <span
              aria-hidden="true"
              className="navigation-ball text-5xl leading-none drop-shadow-[0_10px_18px_rgba(46,206,146,0.28)]"
            >
              ⚽
            </span>
            <p className="mt-4 text-sm font-semibold text-white">Carregando</p>
          </div>
        </div>
      ) : null}
    </NavigationFeedbackContext.Provider>
  );
}

export function useNavigationFeedback() {
  const context = useContext(NavigationFeedbackContext);

  if (!context) {
    throw new Error("useNavigationFeedback precisa estar dentro do provider.");
  }

  return context;
}
