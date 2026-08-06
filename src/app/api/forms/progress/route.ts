import { NextResponse, type NextRequest } from "next/server";
import { webhookPayloadSchema } from "@/lib/validation/webhookPayload";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 20_000;
const N8N_TIMEOUT_MS = 8_000;

interface N8nResponseBody {
  success?: boolean;
  lead_id?: string;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: "payload_too_large" }, { status: 413 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  const result = webhookPayloadSchema.safeParse(parsedJson);
  if (!result.success) {
    return NextResponse.json({ success: false, error: "invalid_payload" }, { status: 400 });
  }

  const webhookUrl = process.env.N8N_FORM_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_FORM_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.error("N8N_FORM_WEBHOOK_URL/N8N_FORM_WEBHOOK_SECRET não configurados no servidor.");
    return NextResponse.json({ success: false, error: "webhook_not_configured" }, { status: 500 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qarvon-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify(result.data),
      signal: controller.signal,
    });

    if (!n8nResponse.ok) {
      console.error(`n8n respondeu ${n8nResponse.status} para event_id=${result.data.event_id}`);
      return NextResponse.json({ success: false, error: "webhook_error" }, { status: 502 });
    }

    const n8nBody: N8nResponseBody | null = await n8nResponse.json().catch(() => null);

    if (!n8nBody?.success) {
      console.error(`n8n rejeitou o evento event_id=${result.data.event_id}`);
      return NextResponse.json({ success: false, error: "webhook_rejected" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      lead_id: n8nBody.lead_id ?? null,
      session_id: result.data.session_id,
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error(
      `Falha ao chamar o webhook n8n para event_id=${result.data.event_id}: ${isAbort ? "timeout" : "erro de rede"}`,
    );
    return NextResponse.json(
      { success: false, error: isAbort ? "webhook_timeout" : "webhook_unreachable" },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
