import type { FormConfig } from "@/forms";
import type { ScheduleRedirectStatus } from "@/hooks/useScheduleRedirect";

interface QualifiedScreenProps {
  screen: FormConfig["qualifiedScreen"];
  status: ScheduleRedirectStatus;
  onScheduleClick: () => void;
}

/**
 * Tela final para leads qualificados. Só é renderizada depois que o n8n
 * confirma o recebimento do evento "form_qualified" (estado "finished").
 */
export function QualifiedScreen({ screen, status, onScheduleClick }: QualifiedScreenProps) {
  const isRedirecting = status === "redirecting";

  return (
    <div className="animate-fade-in-up mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-4 px-6 py-16 sm:px-10">
      <h2 className="text-xl leading-snug font-bold text-neutral-900 sm:text-2xl">
        {screen.title}
      </h2>
      <p className="text-neutral-600">{screen.body}</p>
      <button
        type="button"
        onClick={onScheduleClick}
        disabled={isRedirecting}
        aria-busy={isRedirecting}
        className="w-full rounded-full bg-[var(--form-primary)] px-8 py-4 text-base font-bold tracking-wide text-[var(--form-on-primary)] transition-colors hover:bg-[var(--form-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:self-start"
      >
        {isRedirecting ? "Abrindo agenda..." : screen.buttonText}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          Não foi possível abrir a agenda agora. Tente novamente em alguns instantes.
        </p>
      )}
    </div>
  );
}
