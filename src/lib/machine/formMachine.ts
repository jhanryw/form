import type { Question } from "@/forms/types";
import type { Answers, AnswerValue } from "@/forms/answers";
import { evaluateDisqualification } from "./qualification";

export type MachineState = "cover" | "question" | "qualified" | "disqualified" | "finished";

export interface MachineContext {
  state: MachineState;
  questionIndex: number;
  answers: Answers;
  disqualificationReason: string | null;
}

export type MachineEvent =
  | { type: "START" }
  | { type: "ANSWER"; questionId: string; value: AnswerValue }
  | { type: "BACK" }
  | { type: "CONFIRM" }
  | { type: "RESTORE"; context: MachineContext };

export function createInitialContext(): MachineContext {
  return {
    state: "cover",
    questionIndex: 0,
    answers: {},
    disqualificationReason: null,
  };
}

export function transition(
  context: MachineContext,
  event: MachineEvent,
  questions: Question[],
): MachineContext {
  switch (event.type) {
    case "START": {
      if (context.state !== "cover") return context;
      return { ...context, state: "question", questionIndex: 0 };
    }

    case "ANSWER": {
      if (context.state !== "question") return context;

      const currentQuestion = questions[context.questionIndex];
      const answers = { ...context.answers, [event.questionId]: event.value };
      const { disqualifies, reason } = evaluateDisqualification(currentQuestion, event.value);

      if (disqualifies) {
        return { ...context, answers, state: "disqualified", disqualificationReason: reason };
      }

      const nextIndex = context.questionIndex + 1;
      if (nextIndex >= questions.length) {
        return { ...context, answers, state: "qualified", disqualificationReason: null };
      }

      return { ...context, answers, questionIndex: nextIndex };
    }

    case "BACK": {
      if (context.state !== "question") return context;
      if (context.questionIndex === 0) {
        return { ...context, state: "cover" };
      }
      return { ...context, questionIndex: context.questionIndex - 1 };
    }

    case "CONFIRM": {
      // O "porquê" da confirmação (webhook do n8n) não pertence à máquina —
      // ela só sabe transitar de "qualified" (pendente) para "finished" (confirmado).
      if (context.state !== "qualified") return context;
      return { ...context, state: "finished" };
    }

    case "RESTORE":
      return event.context;

    default:
      return context;
  }
}
