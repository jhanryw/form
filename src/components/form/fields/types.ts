import type { Question } from "@/forms";
import type { AnswerValue } from "@/forms/answers";

export interface FieldComponentProps {
  question: Question;
  value: AnswerValue | undefined;
  onSubmit: (value: AnswerValue) => void;
}
