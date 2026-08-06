"use client";

import type { FormConfig } from "@/forms";
import type { AnswerValue } from "@/forms/answers";
import { useFormMachine } from "@/hooks/useFormMachine";
import { useWebhookSync } from "@/hooks/useWebhookSync";
import { useMetaPixelSync } from "@/hooks/useMetaPixelSync";
import { useScheduleRedirect } from "@/hooks/useScheduleRedirect";
import { CoverScreen } from "./CoverScreen";
import { QuestionScreen } from "./QuestionScreen";
import { QualifiedScreen } from "./QualifiedScreen";
import { QualificationPendingScreen } from "./QualificationPendingScreen";
import { DisqualifiedScreen } from "./DisqualifiedScreen";
import { toThemeVars } from "./theme";

/**
 * Orquestrador puro: renderiza a tela correspondente ao estado atual da
 * máquina de estados. Navegação, validação, qualificação, persistência,
 * sincronização com o webhook, com o Meta Pixel e o redirecionamento para o
 * Cal.com vivem em @/lib e @/hooks — este componente só repassa os pontos de
 * clique/resposta para cada um.
 */
export function FormRunner({ form }: { form: FormConfig }) {
  const machine = useFormMachine(form);
  const { context, start, back, confirm } = machine;

  const { handleAnswer, qualificationSync, retryQualification, sendCalendarRedirect } = useWebhookSync({
    form,
    context,
    sessionId: machine.sessionId,
    startedAt: machine.startedAt,
    tracking: machine.tracking,
    pendingEvents: machine.pendingEvents,
    answer: machine.answer,
    confirm,
    enqueueEvent: machine.enqueueEvent,
    dequeueEvent: machine.dequeueEvent,
    markEventAttempt: machine.markEventAttempt,
  });

  const { handleStart, trackFormStep, trackScheduleIntent } = useMetaPixelSync({
    form,
    context,
    isHydrated: machine.isHydrated,
    sessionId: machine.sessionId,
    trackingEvents: machine.trackingEvents,
    markViewFormFired: machine.markViewFormFired,
    markStartFormFired: machine.markStartFormFired,
    markEndFormFired: machine.markEndFormFired,
    markScheduleIntentFired: machine.markScheduleIntentFired,
    markFormStepFired: machine.markFormStepFired,
  });

  const { status: scheduleStatus, handleClick: handleScheduleClick } = useScheduleRedirect({
    form,
    sessionId: machine.sessionId,
    tracking: machine.tracking,
    trackScheduleIntent,
    sendCalendarRedirect,
  });

  const themeVars = toThemeVars(form.theme);
  const currentQuestion = form.questions[context.questionIndex];

  function handleCoverStart() {
    handleStart();
    start();
  }

  function handleQuestionAnswer(value: AnswerValue) {
    if (!currentQuestion) return;
    trackFormStep(currentQuestion.id, context.questionIndex);
    handleAnswer(currentQuestion.id, value);
  }

  if (!machine.isHydrated) {
    return <div style={themeVars} className="min-h-screen bg-white" />;
  }

  return (
    <div style={themeVars} className="min-h-screen bg-white">
      {context.state === "cover" && <CoverScreen cover={form.cover} onStart={handleCoverStart} />}

      {context.state === "question" && currentQuestion && (
        <QuestionScreen
          key={`question-${context.questionIndex}`}
          question={currentQuestion}
          value={context.answers[currentQuestion.id]}
          onBack={back}
          onAnswer={handleQuestionAnswer}
        />
      )}

      {context.state === "qualified" && (
        <QualificationPendingScreen
          status={qualificationSync === "error" ? "error" : "pending"}
          onRetry={qualificationSync === "error" ? retryQualification : undefined}
        />
      )}

      {context.state === "disqualified" && (
        <DisqualifiedScreen screen={form.disqualifiedScreen} />
      )}

      {context.state === "finished" && (
        <QualifiedScreen
          screen={form.qualifiedScreen}
          status={scheduleStatus}
          onScheduleClick={() => void handleScheduleClick()}
        />
      )}
    </div>
  );
}
