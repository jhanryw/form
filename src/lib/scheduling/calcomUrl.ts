import type { AttributionData } from "@/lib/tracking/attribution";

const ALLOWED_UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export interface ScheduleUrlParams {
  baseUrl: string;
  formId: string;
  formSlug: string;
  formVersion: string;
  sessionId: string;
  attribution: Pick<AttributionData, (typeof ALLOWED_UTM_KEYS)[number]>;
}

/**
 * https: sempre permitido. http://localhost só em desenvolvimento (para
 * testar contra um Cal.com local). Qualquer outro protocolo — javascript:,
 * data:, file:, http: em produção — é rejeitado.
 */
function isAllowedProtocol(url: URL): boolean {
  if (url.protocol === "https:") return true;

  if (process.env.NODE_ENV !== "production" && url.protocol === "http:" && url.hostname === "localhost") {
    return true;
  }

  return false;
}

/**
 * Monta a URL de agendamento a partir do link global do Cal.com. Nunca
 * concatena strings: usa a API nativa URL/URLSearchParams, que preserva
 * qualquer parâmetro já existente no link configurado (usa `.append`, nunca
 * `.set`, para não sobrescrever nada). Só adiciona metadados não sensíveis —
 * nenhuma resposta do usuário passa por aqui.
 */
export function buildScheduleUrl({
  baseUrl,
  formId,
  formSlug,
  formVersion,
  sessionId,
  attribution,
}: ScheduleUrlParams): URL | null {
  if (!baseUrl) return null;

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return null;
  }

  if (!isAllowedProtocol(url)) return null;

  // Identificação do formulário: nunca depende só das UTMs.
  url.searchParams.append("form_id", formId);
  url.searchParams.append("form_slug", formSlug);
  url.searchParams.append("form_version", formVersion);
  url.searchParams.append("session_id", sessionId);

  for (const key of ALLOWED_UTM_KEYS) {
    const value = attribution[key];
    if (value) {
      url.searchParams.append(key, value);
    }
  }

  return url;
}
