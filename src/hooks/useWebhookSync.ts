"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormConfig } from "@/forms";
import type { AnswerValue } from "@/forms/answers";
import { transition, type MachineContext } from "@/lib/machine/formMachine";
import type { PendingEvent } from "@/lib/storage";
import type { AttributionData } from "@/lib/tracking/attribution";
import { buildEventId } from "@/lib/webhook/eventId";
import { buildWebhookPayload } from "@/lib/webhook/payload";
import type { WebhookEventType } from "@/lib/webhook/types";

const MAX_AUTO_ATTEMPTS = 6;
const RETRY_INTERVAL_MS = 15_000;
const CALENDAR_REDIRECT_MAX_WAIT_MS = 1_200;

export type QualificationSyncStatus = "idle" | "pending" | "error";

interface UseWebhookSyncParams {
  form: FormConfig;
  context: MachineContext;
  sessionId: string;
  startedAt: string;
  tracking: AttributionData;
  pendingEvents: PendingEvent[];
  answer: (questionId: string, value: AnswerValue) => void;
  confirm: () => void;
  enqueueEvent: (event: PendingEvent) => void;
  dequeueEvent: (eventId: string) => void;
  markEventAttempt: (eventId: string) => void;
}

/**
 * Camada que decide QUANDO enviar um evento e o que fazer com o resultado.
 * A máquina de estados não sabe que isto existe; ela só recebe um CONFIRM
 * quando o n8n aceita o evento de qualificação.
 */
export function useWebhookSync({
  form,
  context,
  sessionId,
  startedAt,
  tracking,
  pendingEvents,
  answer,
  confirm,
  enqueueEvent,
  dequeueEvent,
  markEventAttempt,
}: UseWebhookSyncParams) {
  const [qualificationSync, setQualificationSync] = useState<QualificationSyncStatus>("idle");
  const qualificationEventIdRef = useRef<string | null>(null);
  const inFlightRef = useRef<Set<string>>(new Set());

  const buildAndQueue = useCallback(
    (eventType: WebhookEventType, nextContext: MachineContext): PendingEvent | null => {
      if (!sessionId) return null;

      const payload = buildWebhookPayload({
        form,
        context: nextContext,
        sessionId,
        startedAt,
        tracking,
        eventType,
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
      });

      const event: PendingEvent = {
        eventId: payload.event_id,
        sessionId,
        eventType,
        payload: payload as unknown as Record<string, unknown>,
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastAttemptAt: null,
      };

      enqueueEvent(event);
      return event;
    },
    [sessionId, startedAt, tracking, form, enqueueEvent],
  );

  const sendEvent = useCallback(
    async (event: PendingEvent) => {
      if (inFlightRef.current.has(event.eventId)) return;
      inFlightRef.current.add(event.eventId);
      markEventAttempt(event.eventId);

      try {
        const response = await fetch("/api/forms/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event.payload),
        });

        const body: { success?: boolean } | null = response.ok
          ? await response.json().catch(() => null)
          : null;

        if (response.ok && body?.success) {
          dequeueEvent(event.eventId);
          if (event.eventId === qualificationEventIdRef.current) {
            setQualificationSync("idle");
            confirm();
          }
          return;
        }

        throw new Error(`webhook respondeu ${response.status}`);
      } catch {
        if (event.eventId === qualificationEventIdRef.current) {
          setQualificationSync("error");
        }
      } finally {
        inFlightRef.current.delete(event.eventId);
      }
    },
    [dequeueEvent, markEventAttempt, confirm],
  );

  // Reconhece uma sessão restaurada já em "qualified" sem evento confirmado.
  useEffect(() => {
    if (context.state === "qualified" && !qualificationEventIdRef.current && sessionId) {
      qualificationEventIdRef.current = buildEventId("form_qualified", sessionId);
      setQualificationSync("pending");
    }
  }, [context.state, sessionId]);

  // Envia automaticamente eventos pendentes (novos ou herdados de uma sessão anterior).
  useEffect(() => {
    pendingEvents
      .filter((event) => event.attempts < MAX_AUTO_ATTEMPTS && !inFlightRef.current.has(event.eventId))
      .forEach((event) => {
        void sendEvent(event);
      });
  }, [pendingEvents, sendEvent]);

  // Retry periódico para falhas transitórias enquanto houver eventos pendentes.
  useEffect(() => {
    if (pendingEvents.length === 0) return;

    const timer = setInterval(() => {
      pendingEvents
        .filter((event) => event.attempts < MAX_AUTO_ATTEMPTS && !inFlightRef.current.has(event.eventId))
        .forEach((event) => {
          void sendEvent(event);
        });
    }, RETRY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [pendingEvents, sendEvent]);

  const handleAnswer = useCallback(
    (questionId: string, value: AnswerValue) => {
      const nextContext = transition(context, { type: "ANSWER", questionId, value }, form.questions);
      answer(questionId, value);

      if (nextContext.state === "qualified") {
        const event = buildAndQueue("form_qualified", nextContext);
        qualificationEventIdRef.current = event?.eventId ?? null;
        setQualificationSync("pending");
      } else if (nextContext.state === "disqualified") {
        buildAndQueue("form_disqualified", nextContext);
      } else if (nextContext.state === "question") {
        buildAndQueue("form_progress", nextContext);
      }
    },
    [context, form, answer, buildAndQueue],
  );

  const retryQualification = useCallback(() => {
    const eventId = qualificationEventIdRef.current;
    if (!eventId) return;

    const event = pendingEvents.find((candidate) => candidate.eventId === eventId);
    if (event) {
      setQualificationSync("pending");
      void sendEvent(event);
    }
  }, [pendingEvents, sendEvent]);

  /**
   * Usada pelo clique em "Escolher meu horário". Reaproveita o mesmo
   * serializer/fila/retry/idempotência dos demais eventos — nenhum fetch
   * próprio aqui. Espera no máximo CALENDAR_REDIRECT_MAX_WAIT_MS pela
   * confirmação; se não vier a tempo, o evento continua na fila (retry
   * automático em segundo plano) e o chamador segue em frente mesmo assim.
   */
  const sendCalendarRedirect = useCallback(async (): Promise<void> => {
    const event = buildAndQueue("calendar_redirect", context);
    if (!event) return;

    await Promise.race([
      sendEvent(event),
      new Promise<void>((resolve) => setTimeout(resolve, CALENDAR_REDIRECT_MAX_WAIT_MS)),
    ]);
  }, [buildAndQueue, context, sendEvent]);

  return { handleAnswer, qualificationSync, retryQualification, sendCalendarRedirect };
}
