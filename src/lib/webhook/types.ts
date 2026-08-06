export type WebhookEventType =
  | "form_progress"
  | "form_qualified"
  | "form_disqualified"
  | "calendar_redirect";

export type FormStatus =
  | "started"
  | "in_progress"
  | "qualified"
  | "disqualified"
  | "redirected_to_calendar";

export interface WebhookInstagramAnswer {
  raw: string;
  username: string;
  url: string;
}

export interface WebhookPhoneAnswer {
  country: string;
  country_code: string;
  national_number: string;
  e164: string;
  display: string;
}

export interface WebhookPayload {
  event_id: string;
  event_type: WebhookEventType;
  session_id: string;
  form: {
    id: string;
    slug: string;
    niche: string;
    version: string;
    page_url: string;
  };
  status: FormStatus;
  /**
   * true somente quando existe um WhatsApp válido (E.164). Enquanto falso,
   * a sessão é apenas uma jornada em andamento — não deve ser tratada como
   * lead contatável por nenhuma automação no n8n.
   */
  contactable: boolean;
  qualification: {
    status: "pending" | "qualified" | "disqualified";
    disqualification_reason: string | null;
  };
  progress: {
    current_step_id: string | null;
    current_step_index: number;
    last_completed_step_id: string | null;
  };
  answers: {
    name: string | null;
    instagram: WebhookInstagramAnswer | null;
    whatsapp: WebhookPhoneAnswer | null;
    monthly_revenue: string | null;
    accepted_media_investment: string | null;
    meeting_availability: string | null;
  };
  attribution: {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    utm_term: string | null;
    fbclid: string | null;
    gclid: string | null;
    ttclid: string | null;
    fbp: string | null;
    fbc: string | null;
    referrer: string | null;
    landing_page: string | null;
  };
  metadata: {
    started_at: string;
    updated_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
    timezone: string;
    language: string;
    user_agent: string;
  };
}
