import type { Answers } from "@/forms/answers";
import type { MachineState } from "@/lib/machine/formMachine";
import type { AttributionData } from "@/lib/tracking/attribution";

const STORAGE_PREFIX = "qarvon_form_session:";
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Formato genérico de fila — não conhece o formato do payload do n8n
 * (isso pertence a @/lib/webhook). Aqui só existe o necessário para
 * retry/idempotência: identidade do evento e histórico de tentativas.
 */
export interface PendingEvent {
  eventId: string;
  sessionId: string;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: string;
  lastAttemptAt: string | null;
}

export interface PersistedProgress {
  state: MachineState;
  questionIndex: number;
  disqualificationReason: string | null;
}

/**
 * Quais eventos do Meta Pixel já foram disparados nesta sessão — evita
 * duplicação após reload. `formSteps` guarda os `step_id` já reportados.
 */
export interface TrackingEventsState {
  viewForm: boolean;
  startForm: boolean;
  endForm: boolean;
  scheduleIntent: boolean;
  formSteps: string[];
}

export interface PersistedSession {
  sessionId: string;
  formSlug: string;
  currentStep: PersistedProgress;
  answers: Answers;
  tracking: AttributionData;
  trackingEvents: TrackingEventsState;
  startedAt: string;
  updatedAt: string;
  pendingEvents: PendingEvent[];
}

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

/**
 * Checagem estrutural mínima — protege contra dado corrompido, editado
 * manualmente ou de um formato incompatível (ex.: versão antiga sem
 * `pendingEvents`), que de outra forma quebraria os hooks que assumem
 * essas chaves (ex.: `pendingEvents.filter(...)`).
 */
function isValidPersistedSession(value: unknown): value is PersistedSession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.sessionId === "string" &&
    typeof v.formSlug === "string" &&
    typeof v.startedAt === "string" &&
    typeof v.updatedAt === "string" &&
    typeof v.currentStep === "object" && v.currentStep !== null &&
    typeof v.answers === "object" && v.answers !== null &&
    typeof v.tracking === "object" && v.tracking !== null &&
    typeof v.trackingEvents === "object" && v.trackingEvents !== null &&
    Array.isArray(v.pendingEvents)
  );
}

export function loadSession(slug: string): PersistedSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidPersistedSession(parsed)) {
      window.localStorage.removeItem(storageKey(slug));
      return null;
    }

    const startedAtMs = Date.parse(parsed.startedAt);

    if (Number.isNaN(startedAtMs) || Date.now() - startedAtMs > TTL_MS) {
      window.localStorage.removeItem(storageKey(slug));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(slug: string, session: PersistedSession): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(session));
  } catch {
    // localStorage indisponível (modo privado, quota excedida, etc.) — o formulário
    // continua funcionando em memória, apenas sem retomada entre sessões.
  }
}

