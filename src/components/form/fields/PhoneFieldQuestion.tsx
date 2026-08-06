"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AsYouType, getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";
import type { PhoneQuestion } from "@/forms";
import { validateAnswer } from "@/lib/validation/schemas";
import type { FieldComponentProps } from "./types";

const countryNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });

interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
}

function buildCountryOptions(defaultCountry: CountryCode): CountryOption[] {
  const options = getCountries().map((code) => ({
    code,
    name: countryNames.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
  }));

  options.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const defaultIndex = options.findIndex((option) => option.code === defaultCountry);
  if (defaultIndex > 0) {
    const [defaultOption] = options.splice(defaultIndex, 1);
    options.unshift(defaultOption);
  }

  return options;
}

export function PhoneFieldQuestion({ question, value, onSubmit }: FieldComponentProps) {
  // Seguro: o registry só invoca este componente quando question.type === "phone".
  const phoneQuestion = question as PhoneQuestion;
  const defaultCountry = (phoneQuestion.defaultCountry as CountryCode) ?? "BR";

  const existingAnswer = value && typeof value === "object" && "e164" in value ? value : undefined;

  const countryOptions = useMemo(() => buildCountryOptions(defaultCountry), [defaultCountry]);
  const [country, setCountry] = useState<CountryCode>(
    (existingAnswer?.country as CountryCode) ?? defaultCountry,
  );
  const [inputValue, setInputValue] = useState(existingAnswer?.display ?? "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(rawInput: string) {
    const cleaned = rawInput.replace(/[^\d+()\s-]/g, "");
    setInputValue(new AsYouType(country).input(cleaned));
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateAnswer(phoneQuestion, { input: inputValue, country });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Número inválido.");
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={country}
          onChange={(event) => setCountry(event.target.value as CountryCode)}
          aria-label="País"
          className="w-full rounded-lg border-2 border-neutral-200 bg-white px-3 py-3 text-base text-neutral-900 outline-none transition-colors focus:border-[var(--form-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--form-primary)] focus-visible:ring-offset-2 sm:w-auto sm:max-w-[45%]"
        >
          {countryOptions.map((option) => (
            <option key={option.code} value={option.code}>
              +{option.callingCode} {option.name}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          value={inputValue}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="(84) 99999-9999"
          className="w-full min-w-0 flex-1 border-b-2 border-neutral-300 bg-transparent py-3 text-lg text-neutral-900 outline-none transition-colors focus:border-[var(--form-primary)]"
        />
      </div>
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
