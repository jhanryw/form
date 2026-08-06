export interface AttributionData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
  referrer: string | null;
  landing_page: string | null;
  /** Cookie _fbp do Meta Pixel (nome sem underscore aqui só por convenção do payload). */
  fbp: string | null;
  /** Cookie _fbc do Meta Pixel, ou montado a partir do fbclid quando ausente. */
  fbc: string | null;
  user_agent: string | null;
  language: string | null;
  timezone: string | null;
  screen_width: number | null;
  screen_height: number | null;
}

export function createEmptyAttribution(): AttributionData {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    fbclid: null,
    gclid: null,
    ttclid: null,
    referrer: null,
    landing_page: null,
    fbp: null,
    fbc: null,
    user_agent: null,
    language: null,
    timezone: null,
    screen_width: null,
    screen_height: null,
  };
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Formato esperado pelo Meta para o cookie _fbc quando ele ainda não existe:
 * fb.{subdomain_index}.{creation_time_ms}.{fbclid}. Nunca inventa um valor
 * quando não há fbclid.
 */
function buildFbcFromClickId(fbclid: string | null): string | null {
  if (!fbclid) return null;
  return `fb.1.${Date.now()}.${fbclid}`;
}

/**
 * Deve ser chamada uma única vez, no momento em que uma sessão NOVA é
 * criada — nunca para uma sessão restaurada do storage (isso sobrescreveria
 * UTMs/referrer originais com os valores da visita de retorno, ou com nulos
 * se o usuário reabriu a mesma aba sem parâmetros na URL).
 */
export function captureAttribution(): AttributionData {
  if (typeof window === "undefined") {
    return createEmptyAttribution();
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");

    return {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      fbclid,
      gclid: params.get("gclid"),
      ttclid: params.get("ttclid"),
      referrer: document.referrer || null,
      landing_page: window.location.href,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc") ?? buildFbcFromClickId(fbclid),
      user_agent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_width: window.screen?.width ?? null,
      screen_height: window.screen?.height ?? null,
    };
  } catch {
    return createEmptyAttribution();
  }
}
