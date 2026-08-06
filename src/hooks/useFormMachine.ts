"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { FormConfig } from "@/forms";
import type { AnswerValue } from "@/forms/answers";
import {
  createInitialContext,
  transition,
  type MachineContext,
  type MachineEvent,
} from "@/lib/machine/formMachine";
import { loadSession, saveSession, type PendingEvent, type TrackingEventsState } from "@/lib/storage";
import { createSessionId } from "@/lib/ids";
import { captureAttribution, type AttributionData } from "@/lib/tracking/attribution";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

interface SessionMeta {
  sessionId: string;
  startedAt: string;
  tracking: AttributionData;
  trackingEvents: TrackingEventsState;
  pendingEvents: PendingEvent[];
  isHydrated: boolean;
}

type SessionMetaEvent =
  | { type: "HYDRATE"; meta: Omit<SessionMeta, "isHydrated"> }
  | { type: "ENQUEUE_EVENT"; event: PendingEvent }
  | { type: "DEQUEUE_EVENT"; eventId: string }
  | { type: "MARK_EVENT_ATTEMPT"; eventId: string }
  | { type: "MARK_VIEW_FORM_FIRED" }
  | { type: "MARK_START_FORM_FIRED" }
  | { type: "MARK_END_FORM_FIRED" }
  | { type: "MARK_SCHEDULE_INTENT_FIRED" }
  | { type: "MARK_FORM_STEP_FIRED"; stepId: string };

function createEmptyTrackingEvents(): TrackingEventsState {
  return { viewForm: false, startForm: false, endForm: false, scheduleIntent: false, formSteps: [] };
}

function createEmptySessionMeta(): SessionMeta {
  return {
    sessionId: "",
    startedAt: "",
    tracking: {
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
    },
    trackingEvents: createEmptyTrackingEvents(),
    pendingEvents: [],
    isHydrated: false,
  };
}

function sessionMetaReducer(state: SessionMeta, event: SessionMetaEvent): SessionMeta {
  switch (event.type) {
    case "HYDRATE":
      return { ...event.meta, isHydrated: true };
    case "ENQUEUE_EVENT":
      return {
        ...state,
        pendingEvents: [
          ...state.pendingEvents.filter((existing) => existing.eventId !== event.event.eventId),
          event.event,
        ],
      };
    case "DEQUEUE_EVENT":
      return {
        ...state,
        pendingEvents: state.pendingEvents.filter((existing) => existing.eventId !== event.eventId),
      };
    case "MARK_EVENT_ATTEMPT":
      return {
        ...state,
        pendingEvents: state.pendingEvents.map((existing) =>
          existing.eventId === event.eventId
            ? { ...existing, attempts: existing.attempts + 1, lastAttemptAt: new Date().toISOString() }
            : existing,
        ),
      };
    case "MARK_VIEW_FORM_FIRED":
      return { ...state, trackingEvents: { ...state.trackingEvents, viewForm: true } };
    case "MARK_START_FORM_FIRED":
      return { ...state, trackingEvents: { ...state.trackingEvents, startForm: true } };
    case "MARK_END_FORM_FIRED":
      return { ...state, trackingEvents: { ...state.trackingEvents, endForm: true } };
    case "MARK_SCHEDULE_INTENT_FIRED":
      return { ...state, trackingEvents: { ...state.trackingEvents, scheduleIntent: true } };
    case "MARK_FORM_STEP_FIRED":
      return state.trackingEvents.formSteps.includes(event.stepId)
        ? state
        : {
            ...state,
            trackingEvents: {
              ...state.trackingEvents,
              formSteps: [...state.trackingEvents.formSteps, event.stepId],
            },
          };
    default:
      return state;
  }
}

/**
 * O estado inicial é sempre "cover" no primeiro render (servidor e cliente),
 * para não gerar divergência de hidratação. A sessão persistida (se houver)
 * só é aplicada depois de montado, via RESTORE/HYDRATE — cada um em um único
 * dispatch, para não disparar múltiplos setState síncronos dentro do efeito.
 */
export function useFormMachine(form: FormConfig) {
  const [context, dispatch] = useReducer(
    (state: MachineContext, event: MachineEvent) => transition(state, event, form.questions),
    undefined,
    createInitialContext,
  );

  const [sessionMeta, dispatchMeta] = useReducer(sessionMetaReducer, undefined, createEmptySessionMeta);
  const hasHydratedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    // useLayoutEffect (via useIsomorphicLayoutEffect): roda antes do primeiro
    // paint no navegador, então uma sessão restaurada (ex.: "disqualified")
    // nunca chega a pintar a capa na tela, nem por um frame.
    //
    // Guarda contra o double-invoke de efeitos do React Strict Mode (dev):
    // sem isso, a segunda execução releria o storage já sobrescrito pelo
    // efeito de salvamento e disparuia um RESTORE incorreto por cima do real.
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    const persisted = loadSession(form.slug);

    if (persisted) {
      dispatchMeta({
        type: "HYDRATE",
        meta: {
          sessionId: persisted.sessionId,
          startedAt: persisted.startedAt,
          tracking: persisted.tracking,
          trackingEvents: persisted.trackingEvents ?? createEmptyTrackingEvents(),
          pendingEvents: persisted.pendingEvents,
        },
      });
      dispatch({
        type: "RESTORE",
        context: {
          state: persisted.currentStep.state,
          questionIndex: persisted.currentStep.questionIndex,
          disqualificationReason: persisted.currentStep.disqualificationReason,
          answers: persisted.answers,
        },
      });
    } else {
      // Atribuição só é capturada aqui — na criação de uma sessão nova.
      // Uma sessão restaurada nunca deve ter suas UTMs/referrer sobrescritos.
      dispatchMeta({
        type: "HYDRATE",
        meta: {
          sessionId: createSessionId(),
          startedAt: new Date().toISOString(),
          tracking: captureAttribution(),
          trackingEvents: createEmptyTrackingEvents(),
          pendingEvents: [],
        },
      });
    }
  }, [form.slug]);

  useEffect(() => {
    if (!hasHydratedRef.current || !sessionMeta.sessionId) return;

    saveSession(form.slug, {
      sessionId: sessionMeta.sessionId,
      formSlug: form.slug,
      currentStep: {
        state: context.state,
        questionIndex: context.questionIndex,
        disqualificationReason: context.disqualificationReason,
      },
      answers: context.answers,
      tracking: sessionMeta.tracking,
      trackingEvents: sessionMeta.trackingEvents,
      startedAt: sessionMeta.startedAt,
      updatedAt: new Date().toISOString(),
      pendingEvents: sessionMeta.pendingEvents,
    });
  }, [context, form.slug, sessionMeta]);

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const confirm = useCallback(() => dispatch({ type: "CONFIRM" }), []);
  const answer = useCallback(
    (questionId: string, value: AnswerValue) => dispatch({ type: "ANSWER", questionId, value }),
    [],
  );

  const enqueueEvent = useCallback(
    (event: PendingEvent) => dispatchMeta({ type: "ENQUEUE_EVENT", event }),
    [],
  );
  const dequeueEvent = useCallback(
    (eventId: string) => dispatchMeta({ type: "DEQUEUE_EVENT", eventId }),
    [],
  );
  const markEventAttempt = useCallback(
    (eventId: string) => dispatchMeta({ type: "MARK_EVENT_ATTEMPT", eventId }),
    [],
  );

  const markViewFormFired = useCallback(() => dispatchMeta({ type: "MARK_VIEW_FORM_FIRED" }), []);
  const markStartFormFired = useCallback(() => dispatchMeta({ type: "MARK_START_FORM_FIRED" }), []);
  const markEndFormFired = useCallback(() => dispatchMeta({ type: "MARK_END_FORM_FIRED" }), []);
  const markScheduleIntentFired = useCallback(
    () => dispatchMeta({ type: "MARK_SCHEDULE_INTENT_FIRED" }),
    [],
  );
  const markFormStepFired = useCallback(
    (stepId: string) => dispatchMeta({ type: "MARK_FORM_STEP_FIRED", stepId }),
    [],
  );

  return {
    context,
    isHydrated: sessionMeta.isHydrated,
    sessionId: sessionMeta.sessionId,
    startedAt: sessionMeta.startedAt,
    tracking: sessionMeta.tracking,
    trackingEvents: sessionMeta.trackingEvents,
    pendingEvents: sessionMeta.pendingEvents,
    start,
    back,
    answer,
    confirm,
    enqueueEvent,
    dequeueEvent,
    markEventAttempt,
    markViewFormFired,
    markStartFormFired,
    markEndFormFired,
    markScheduleIntentFired,
    markFormStepFired,
  };
}
