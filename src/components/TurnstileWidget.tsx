import { useEffect, useRef, useCallback } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_ID = "cf-turnstile-script";

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !globalThis.window?.turnstile || widgetIdRef.current) return;

    widgetIdRef.current = globalThis.window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onVerify,
      "expired-callback": onExpire,
      "error-callback": onError,
      theme: "auto",
      size: "invisible",
    });
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    if (!SITE_KEY) {
      console.warn("Turnstile: VITE_TURNSTILE_SITE_KEY manquant");
      return;
    }

    // Si le script est déjà chargé, render directement
    if (globalThis.window?.turnstile) {
      renderWidget();
      return;
    }

    // Charger le script Turnstile
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget);
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && globalThis.window?.turnstile) {
        globalThis.window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="sr-only" aria-hidden="true" />;
}
