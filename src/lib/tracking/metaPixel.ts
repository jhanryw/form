declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
  }
}

function logDevError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[meta-pixel] ${context}`, error);
  }
}

/**
 * Único ponto de contato com window.fbq. Nunca lança: ad blocker, Pixel
 * ausente ou falha de carregamento do script nunca podem quebrar o
 * formulário nem bloquear o webhook.
 */
function safeFbq(...args: unknown[]): void {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq(...args);
  } catch (error) {
    logDevError("falha ao disparar evento", error);
  }
}

export function trackPageView(): void {
  safeFbq("track", "PageView");
}

export function trackStandardEvent(eventName: string, params?: Record<string, unknown>): void {
  safeFbq("track", eventName, params);
}

export function trackCustomEvent(eventName: string, params?: Record<string, unknown>): void {
  safeFbq("trackCustom", eventName, params);
}
