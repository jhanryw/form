import type { FormConfig } from "@/forms";

interface DisqualifiedScreenProps {
  screen: FormConfig["disqualifiedScreen"];
  onCtaClick?: () => void;
}

/**
 * Tela final para leads desqualificados (faturamento ou investimento).
 * Deliberadamente não recebe o motivo da desqualificação como texto — ele é
 * interno (payload do webhook) e nunca deve aparecer para o usuário final.
 * O envio ao n8n acontece em segundo plano (fila com retry); esta tela não
 * espera confirmação porque não existe nenhuma ação subsequente que dependa
 * do resultado.
 */
export function DisqualifiedScreen({ screen, onCtaClick }: DisqualifiedScreenProps) {
  return (
    <div className="animate-fade-in-up mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-4 px-6 py-16 sm:px-10">
      <h2 className="text-xl leading-snug font-bold text-neutral-900 sm:text-2xl">
        {screen.title}
      </h2>
      <p className="text-neutral-600">{screen.body}</p>
      {screen.ctaText && (
        <button
          type="button"
          onClick={onCtaClick}
          className="self-start rounded-full bg-[var(--form-primary)] px-8 py-3 text-base font-bold text-[var(--form-on-primary)] transition-colors hover:bg-[var(--form-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2"
        >
          {screen.ctaText}
        </button>
      )}
    </div>
  );
}
