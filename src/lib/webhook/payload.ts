import type { FormConfig } from "@/forms";
import type { InstagramAnswer, PhoneAnswer } from "@/forms/answers";
import type { MachineContext } from "@/lib/machine/formMachine";
import type { AttributionData } from "@/lib/tracking/attribution";
import { buildEventId } from "./eventId";
import type { FormStatus, WebhookEventType, WebhookPayload } from "./types";

/**
 * Única camada que sabe traduzir o estado interno (state machine + storage)
 * para o formato de payload esperado pelo n8n. A state machine e o
 * localStorage não conhecem este formato — só esta função.
 */
export interface BuildWebhookPayloadParams {
  form: FormConfig;
  context: MachineContext;
  sessionId: string;
  startedAt: string;
  tracking: AttributionData;
  eventType: WebhookEventType;
  pageUrl: string;
}

function isInstagramAnswer(value: unknown): value is InstagramAnswer {
  return Boolean(value && typeof value === "object" && "username" in value);
}

function isPhoneAnswer(value: unknown): value is PhoneAnswer {
  return Boolean(value && typeof value === "object" && "e164" in value);
}

function isTerminalState(state: MachineContext["state"]): boolean {
  return state === "qualified" || state === "disqualified" || state === "finished";
}

function statusFor(state: MachineContext["state"], eventType: WebhookEventType): FormStatus {
  if (eventType === "calendar_redirect") return "redirected_to_calendar";

  switch (state) {
    case "disqualified":
      return "disqualified";
    case "qualified":
    case "finished":
      return "qualified";
    case "question":
      return "in_progress";
    case "cover":
    default:
      return "started";
  }
}

function getCurrentQuestion(form: FormConfig, context: MachineContext) {
  return context.state === "question" ? form.questions[context.questionIndex] : undefined;
}

function getLastCompletedQuestion(form: FormConfig, context: MachineContext) {
  if (context.state === "question") {
    return context.questionIndex > 0 ? form.questions[context.questionIndex - 1] : undefined;
  }
  if (context.state === "qualified" || context.state === "finished") {
    return form.questions[form.questions.length - 1];
  }
  if (context.state === "disqualified") {
    return form.questions[context.questionIndex];
  }
  return undefined;
}

export function buildWebhookPayload({
  form,
  context,
  sessionId,
  startedAt,
  tracking,
  eventType,
  pageUrl,
}: BuildWebhookPayloadParams): WebhookPayload {
  const { answers } = context;
  const instagram = isInstagramAnswer(answers.instagram) ? answers.instagram : null;
  const whatsapp = isPhoneAnswer(answers.whatsapp) ? answers.whatsapp : null;

  const currentQuestion = getCurrentQuestion(form, context);
  const lastCompletedQuestion = getLastCompletedQuestion(form, context);
  const terminal = isTerminalState(context.state);
  const nowIso = new Date().toISOString();

  const eventId = buildEventId(eventType, sessionId, {
    stepId: lastCompletedQuestion?.id ?? currentQuestion?.id,
    reason: context.disqualificationReason ?? undefined,
  });

  return {
    event_id: eventId,
    event_type: eventType,
    session_id: sessionId,
    form: {
      id: form.id,
      slug: form.slug,
      niche: form.niche,
      version: form.version,
      page_url: pageUrl,
    },
    status: statusFor(context.state, eventType),
    contactable: Boolean(whatsapp?.e164),
    qualification: {
      status:
        context.state === "qualified" || context.state === "finished"
          ? "qualified"
          : context.state === "disqualified"
            ? "disqualified"
            : "pending",
      disqualification_reason: context.disqualificationReason,
    },
    progress: {
      current_step_id: currentQuestion?.id ?? null,
      current_step_index:
        context.state === "question" || context.state === "disqualified"
          ? context.questionIndex
          : form.questions.length,
      last_completed_step_id: lastCompletedQuestion?.id ?? null,
    },
    answers: {
      name: typeof answers.name === "string" ? answers.name : null,
      instagram,
      whatsapp: whatsapp
        ? {
            country: whatsapp.country,
            country_code: whatsapp.countryCode,
            national_number: whatsapp.nationalNumber,
            e164: whatsapp.e164,
            display: whatsapp.display,
          }
        : null,
      monthly_revenue: typeof answers.monthly_revenue === "string" ? answers.monthly_revenue : null,
      accepted_media_investment:
        typeof answers.accepted_media_investment === "string" ? answers.accepted_media_investment : null,
      meeting_availability:
        typeof answers.meeting_availability === "string" ? answers.meeting_availability : null,
    },
    attribution: {
      utm_source: tracking.utm_source,
      utm_medium: tracking.utm_medium,
      utm_campaign: tracking.utm_campaign,
      utm_content: tracking.utm_content,
      utm_term: tracking.utm_term,
      fbclid: tracking.fbclid,
      gclid: tracking.gclid,
      ttclid: tracking.ttclid,
      fbp: tracking.fbp,
      fbc: tracking.fbc,
      referrer: tracking.referrer,
      landing_page: tracking.landing_page,
    },
    metadata: {
      started_at: startedAt,
      updated_at: nowIso,
      completed_at: terminal ? nowIso : null,
      duration_seconds: terminal ? Math.round((Date.parse(nowIso) - Date.parse(startedAt)) / 1000) : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== "undefined" ? navigator.language : "pt-BR",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    },
  };
}
