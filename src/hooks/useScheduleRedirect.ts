"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { FormConfig } from "@/forms";
import type { AttributionData } from "@/lib/tracking/attribution";
import { buildScheduleUrl } from "@/lib/scheduling/calcomUrl";

export type ScheduleRedirectStatus = "idle" | "redirecting" | "error";

/**
 * Fallback usado somente se NEXT_PUBLIC_CALCOM_URL não chegar ao bundle
 * (ex.: build-arg não propagado pelo painel de deploy). É um link fixo do
 * nicho "trafego" — se um segundo nicho for registrado com um Cal.com
 * diferente, este fallback precisa deixar de ser global (ex.: mover para a
 * config do formulário) para não redirecionar o lead para a agenda errada.
 */
const DEFAULT_CALCOM_URL = "https://qarvon-calcom.uxxkgy.easypanel.host/qarvon/30min";

const configuredCalcomUrl = process.env.NEXT_PUBLIC_CALCOM_URL?.trim() || DEFAULT_CALCOM_URL;

interface UseScheduleRedirectParams {
  form: FormConfig;
  sessionId: string;
  tracking: AttributionData;
  trackScheduleIntent: () => void;
  sendCalendarRedirect: () => Promise<void>;
}

/**
 * Orquestra o clique em "Escolher meu horário": trava contra clique duplo,
 * dispara ScheduleIntent, tenta o evento calendar_redirect (com espera
 * curta e limitada) e só então redireciona — nessa ordem exata. Se a URL
 * do Cal.com estiver ausente/inválida, nada disso acontece: nem
 * ScheduleIntent, nem calendar_redirect, nem redirecionamento.
 *
 * A trava usa um ref (não o state `status`): o state só atualiza no próximo
 * render, então dois cliques na mesma tarefa síncrona veriam o mesmo `status`
 * "idle" e passariam pela checagem — o ref é lido/escrito imediatamente e
 * fecha essa brecha.
 */
export function useScheduleRedirect({
  form,
  sessionId,
  tracking,
  trackScheduleIntent,
  sendCalendarRedirect,
}: UseScheduleRedirectParams) {
  const [status, setStatus] = useState<ScheduleRedirectStatus>("idle");
  const hasClickedRef = useRef(false);

  const scheduleUrl = useMemo(() => {
    if (!sessionId) return null;

    return buildScheduleUrl({
      baseUrl: configuredCalcomUrl,
      formId: form.id,
      formSlug: form.slug,
      formVersion: form.version,
      sessionId,
      attribution: tracking,
    });
  }, [form.id, form.slug, form.version, sessionId, tracking]);

  const handleClick = useCallback(async () => {
    if (hasClickedRef.current) return;

    if (!scheduleUrl) {
      setStatus("error");
      return;
    }

    hasClickedRef.current = true;
    setStatus("redirecting");
    trackScheduleIntent();

    try {
      await sendCalendarRedirect();
    } finally {
      window.location.href = scheduleUrl.toString();
    }
  }, [scheduleUrl, trackScheduleIntent, sendCalendarRedirect]);

  return { status, handleClick };
}
