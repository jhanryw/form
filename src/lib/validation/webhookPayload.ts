import { z } from "zod";

/**
 * A API interna não confia no payload do navegador: tudo é revalidado aqui
 * antes de ser encaminhado ao n8n (estrutura, enums permitidos, tamanho
 * máximo de strings, ausência de parâmetros inesperados).
 */
const instagramAnswerSchema = z
  .object({
    raw: z.string().max(200),
    username: z.string().max(60),
    url: z.string().max(200),
  })
  .strict()
  .nullable();

const phoneAnswerSchema = z
  .object({
    country: z.string().max(5),
    country_code: z.string().max(5),
    national_number: z.string().max(20),
    e164: z.string().max(20),
    display: z.string().max(30),
  })
  .strict()
  .nullable();

export const webhookPayloadSchema = z
  .object({
    event_id: z.string().min(1).max(200),
    event_type: z.enum(["form_progress", "form_qualified", "form_disqualified", "calendar_redirect"]),
    session_id: z.string().min(1).max(100),
    form: z
      .object({
        id: z.string().min(1).max(100),
        slug: z.string().min(1).max(100),
        niche: z.string().min(1).max(100),
        version: z.string().min(1).max(20),
        page_url: z.string().max(500),
      })
      .strict(),
    status: z.enum(["started", "in_progress", "qualified", "disqualified", "redirected_to_calendar"]),
    contactable: z.boolean(),
    qualification: z
      .object({
        status: z.enum(["pending", "qualified", "disqualified"]),
        disqualification_reason: z.string().max(100).nullable(),
      })
      .strict(),
    progress: z
      .object({
        current_step_id: z.string().max(100).nullable(),
        current_step_index: z.number().int().min(0).max(50),
        last_completed_step_id: z.string().max(100).nullable(),
      })
      .strict(),
    answers: z
      .object({
        name: z.string().max(80).nullable(),
        instagram: instagramAnswerSchema,
        whatsapp: phoneAnswerSchema,
        monthly_revenue: z.string().max(50).nullable(),
        accepted_media_investment: z.string().max(50).nullable(),
        meeting_availability: z.string().max(50).nullable(),
      })
      .strict(),
    attribution: z
      .object({
        utm_source: z.string().max(200).nullable(),
        utm_medium: z.string().max(200).nullable(),
        utm_campaign: z.string().max(200).nullable(),
        utm_content: z.string().max(200).nullable(),
        utm_term: z.string().max(200).nullable(),
        fbclid: z.string().max(500).nullable(),
        gclid: z.string().max(500).nullable(),
        ttclid: z.string().max(500).nullable(),
        fbp: z.string().max(200).nullable(),
        fbc: z.string().max(200).nullable(),
        referrer: z.string().max(500).nullable(),
        landing_page: z.string().max(500).nullable(),
      })
      .strict(),
    metadata: z
      .object({
        started_at: z.string().max(40),
        updated_at: z.string().max(40),
        completed_at: z.string().max(40).nullable(),
        duration_seconds: z.number().int().nullable(),
        timezone: z.string().max(60),
        language: z.string().max(20),
        user_agent: z.string().max(500),
      })
      .strict(),
  })
  .strict();

export type ValidatedWebhookPayload = z.infer<typeof webhookPayloadSchema>;
