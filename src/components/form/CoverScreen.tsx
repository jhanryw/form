import type { FormConfig } from "@/forms";

interface CoverScreenProps {
  cover: FormConfig["cover"];
  onStart: () => void;
}

export function CoverScreen({ cover, onStart }: CoverScreenProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-8 px-6 py-16 sm:px-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl leading-snug font-extrabold text-neutral-900 sm:text-3xl">
          {cover.headline}
        </h1>
        <p className="text-base text-neutral-600 sm:text-lg">{cover.subtitle}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {cover.bullets.map((bullet) => (
          <li key={bullet} className="text-base text-neutral-800 sm:text-lg">
            {bullet}
          </li>
        ))}
      </ul>

      <p className="text-sm text-neutral-500 italic">{cover.qualificationFooter}</p>

      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-full bg-[var(--form-primary)] px-8 py-4 text-base font-bold tracking-wide text-[var(--form-on-primary)] transition-colors hover:bg-[var(--form-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2 sm:w-auto sm:self-start"
      >
        {cover.buttonText}
      </button>
    </div>
  );
}
