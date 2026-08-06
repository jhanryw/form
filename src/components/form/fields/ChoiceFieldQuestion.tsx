"use client";

import { useEffect, useRef } from "react";
import type { ChoiceQuestion } from "@/forms";
import { validateAnswer } from "@/lib/validation/schemas";
import type { FieldComponentProps } from "./types";

export function ChoiceFieldQuestion({ question, value, onSubmit }: FieldComponentProps) {
  // Seguro: o registry só invoca este componente quando question.type === "choice".
  const choiceQuestion = question as ChoiceQuestion;
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  function handleSelect(optionValue: string) {
    const result = validateAnswer(choiceQuestion, optionValue);
    if (result.success) {
      onSubmit(result.data);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {choiceQuestion.options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            ref={index === 0 ? firstButtonRef : undefined}
            type="button"
            onClick={() => handleSelect(option.value)}
            aria-pressed={isSelected}
            className={`w-full rounded-xl border-2 px-5 py-4 text-left text-base font-medium text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2 ${
              isSelected
                ? "border-[var(--form-primary)] bg-neutral-50"
                : "border-neutral-200 hover:border-[var(--form-primary)] hover:bg-neutral-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
