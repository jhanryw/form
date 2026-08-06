import type { Question } from "@/forms/types";
import type { AnswerValue } from "@/forms/answers";

export interface DisqualificationResult {
  disqualifies: boolean;
  reason: string | null;
}

export function evaluateDisqualification(
  question: Question,
  value: AnswerValue,
): DisqualificationResult {
  if (question.type !== "choice" || typeof value !== "string") {
    return { disqualifies: false, reason: null };
  }

  const option = question.options.find((candidate) => candidate.value === value);
  if (!option?.disqualifies) {
    return { disqualifies: false, reason: null };
  }

  return { disqualifies: true, reason: option.disqualificationReason ?? null };
}
