"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { TextQuestion } from "@/forms";
import { validateAnswer } from "@/lib/validation/schemas";
import type { FieldComponentProps } from "./types";

export function TextFieldQuestion({ question, value, onSubmit }: FieldComponentProps) {
  // Seguro: o registry só invoca este componente quando question.type === "text".
  const textQuestion = question as TextQuestion;

  const [inputValue, setInputValue] = useState(typeof value === "string" ? value : "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateAnswer(textQuestion, inputValue);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Valor inválido.");
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder="Digite seu nome"
        autoComplete="name"
        className="w-full border-b-2 border-neutral-300 bg-transparent py-3 text-lg text-neutral-900 outline-none transition-colors focus:border-[var(--form-primary)]"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="self-start rounded-full bg-[var(--form-primary)] px-8 py-3 text-base font-bold text-[var(--form-on-primary)] transition-colors hover:bg-[var(--form-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2"
      >
        Avançar
      </button>
    </form>
  );
}
