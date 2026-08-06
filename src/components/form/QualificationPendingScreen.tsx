interface QualificationPendingScreenProps {
  status: "pending" | "error";
  onRetry?: () => void;
}

/**
 * Estado transitório enquanto o evento "form_qualified" ainda não foi
 * confirmado pelo n8n. A tela dos 98% (QualifiedScreen) só aparece depois
 * da confirmação — nunca antes. Este texto não vem da configuração do
 * formulário porque é uma mensagem de status do sistema, não copy de
 * marketing por nicho.
 */
export function QualificationPendingScreen({ status, onRetry }: QualificationPendingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in-up mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-4 px-6 py-16 sm:px-10"
    >
      {status === "pending" ? (
        <>
          <h2 className="text-xl leading-snug font-bold text-neutral-900 sm:text-2xl">
            Enviando suas informações...
          </h2>
          <p className="text-neutral-600">Só um instante, estamos confirmando o recebimento.</p>
        </>
      ) : (
        <>
          <h2 className="text-xl leading-snug font-bold text-neutral-900 sm:text-2xl">
            Não conseguimos concluir o envio agora
          </h2>
          <p className="text-neutral-600">Suas respostas foram preservadas. Tente novamente.</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start rounded-full bg-[var(--form-primary)] px-8 py-3 text-base font-bold text-[var(--form-on-primary)] transition-colors hover:bg-[var(--form-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2"
            >
              Tentar novamente
            </button>
          )}
        </>
      )}
    </div>
  );
}
