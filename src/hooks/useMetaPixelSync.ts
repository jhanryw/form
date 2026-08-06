"use client";

import { useCallback, useEffect, useRef } from "react";
import type { FormConfig } from "@/forms";
import type { MachineContext } from "@/lib/machine/formMachine";
import type { TrackingEventsState } from "@/lib/storage";
import { trackCustomEvent, trackPageView } from "@/lib/tracking/metaPixel";

interface UseMetaPixelSyncParams {
  form: FormConfig;
  context: MachineContext;
  isHydrated: boolean;
  sessionId: string;
  trackingEvents: TrackingEventsState;
  markViewFormFired: () => void;
  markStartFormFired: () => void;
  markEndFormFired: () => void;
  markScheduleIntentFired: () => void;
  markFormStepFired: (stepId: string) => void;
}

/**
 * Único ponto que chama trackPageView/trackCustomEvent para o funil do
 * formulário. Não conhece o webhook nem a validação — só reage ao estado da
 * máquina e aos pontos de clique explícitos (start/resposta confirmada) que
 * o FormRunner repassa. Nunca recebe nem envia o valor de uma resposta.
 */
export function useMetaPixelSync({
  form,
  context,
  isHydrated,
  sessionId,
  trackingEvents,
  markViewFormFired,
  markStartFormFired,
  markEndFormFired,
  markScheduleIntentFired,
  markFormStepFired,
}: UseMetaPixelSyncParams) {
  const hasFiredPageViewRef = useRef(false);

  const baseParams = useCallback(
    () => ({
      form_id: form.id,
      form_slug: form.slug,
      form_version: form.version,
      niche: form.niche,
      session_id: sessionId,
    }),
    [form.id, form.slug, form.version, form.niche, sessionId],
  );

  // PageView: uma vez por carregamento da rota (não persistido — um reload
  // real deve contar como uma nova visualização de página).
  useEffect(() => {
    if (hasFiredPageViewRef.current) return;
    hasFiredPageViewRef.current = true;
    trackPageView();
  }, []);

  // ViewForm: uma vez por sessão, quando a capa está visível e a sessão hidratada.
  useEffect(() => {
    if (!isHydrated || !sessionId || trackingEvents.viewForm) return;
    if (context.state !== "cover") return;
    markViewFormFired();
    trackCustomEvent("ViewForm", baseParams());
  }, [isHydrated, sessionId, trackingEvents.viewForm, context.state, markViewFormFired, baseParams]);

  // EndForm: uma vez por sessão, só quando o n8n já confirmou (estado "finished").
  // Nunca para desqualificados, pois eles não alcançam esse estado.
  useEffect(() => {
    if (!sessionId || trackingEvents.endForm) return;
    if (context.state !== "finished") return;
    markEndFormFired();
    trackCustomEvent("EndForm", baseParams());
  }, [sessionId, trackingEvents.endForm, context.state, markEndFormFired, baseParams]);

  const handleStart = useCallback(() => {
    if (sessionId && !trackingEvents.startForm) {
      markStartFormFired();
      trackCustomEvent("StartForm", baseParams());
    }
  }, [sessionId, trackingEvents.startForm, markStartFormFired, baseParams]);

  const trackFormStep = useCallback(
    (stepId: string, stepIndex: number) => {
      if (!sessionId || trackingEvents.formSteps.includes(stepId)) return;
      markFormStepFired(stepId);
      trackCustomEvent("FormStep", { ...baseParams(), step_id: stepId, step_index: stepIndex });
    },
    [sessionId, trackingEvents.formSteps, markFormStepFired, baseParams],
  );

  // ScheduleIntent: uma vez por sessão, disparado no clique real do usuário
  // (chamado explicitamente pelo useScheduleRedirect) — nunca automático.
  const trackScheduleIntent = useCallback(() => {
    if (sessionId && !trackingEvents.scheduleIntent) {
      markScheduleIntentFired();
      trackCustomEvent("ScheduleIntent", baseParams());
    }
  }, [sessionId, trackingEvents.scheduleIntent, markScheduleIntentFired, baseParams]);

  return { handleStart, trackFormStep, trackScheduleIntent };
}
