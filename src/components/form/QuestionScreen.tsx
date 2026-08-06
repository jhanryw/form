import type { Question } from "@/forms";
import type { AnswerValue } from "@/forms/answers";
import { StepShell } from "./StepShell";
import { fieldComponents } from "./fields/registry";

interface QuestionScreenProps {
  question: Question;
  value: AnswerValue | undefined;
  onBack: () => void;
  onAnswer: (value: AnswerValue) => void;
}

export function QuestionScreen({ question, value, onBack, onAnswer }: QuestionScreenProps) {
  const FieldComponent = fieldComponents[question.type];

  return (
    <StepShell onBack={onBack} question={question.question} helperText={question.helperText}>
      <FieldComponent question={question} value={value} onSubmit={onAnswer} />
    </StepShell>
  );
}
