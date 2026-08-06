import type { WebhookEventType } from "./types";

/**
 * IDs determinísticos: reenviar o mesmo evento (retry) sempre produz o
 * mesmo event_id, permitindo que o n8n faça upsert em vez de duplicar.
 */
export function buildEventId(
  eventType: WebhookEventType,
  sessionId: string,
  extra?: { stepId?: string; reason?: string },
): string {
  switch (eventType) {
    case "form_progress":
      return `progress:${sessionId}:${extra?.stepId ?? "cover"}`;
    case "form_qualified":
      return `qualified:${sessionId}`;
    case "form_disqualified":
      return `disqualified:${sessionId}:${extra?.reason ?? "unknown"}`;
    case "calendar_redirect":
      return `calendar:${sessionId}`;
  }
}
