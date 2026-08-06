import type { ReactNode } from "react";

interface StepShellProps {
  onBack: () => void;
  question: string;
  helperText?: string;
  children: ReactNode;
}

export function StepShell({ onBack, question, helperText, children }: StepShellProps) {
  return (
    <div className="animate-fade-in-up mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-8 px-6 py-16 sm:px-10">
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2"
      >
        ← Voltar
      </button>

      <div className="flex flex-col gap-6">
        {helperText && (
          <p className="text-sm leading-relaxed text-neutral-600">{helperText}</p>
        )}
        <h2
          className="text-xl font-bold leading-snug text-neutral-900 sm:text-2xl"
          style={{ whiteSpace: "pre-line" }}
        >
          {question}
        </h2>
        {children}
      </div>
    </div>
  );
}
