import { z } from "zod";
import type {
  Question,
  TextQuestion,
  InstagramQuestion,
  PhoneQuestion,
  ChoiceQuestion,
} from "@/forms/types";
import type { InstagramAnswer, PhoneAnswer } from "@/forms/answers";
import { normalizeInstagram } from "./instagram";
import { normalizePhone } from "./phone";

export interface PhoneRawInput {
  input: string;
  country: string;
}

function textAnswerSchema(question: TextQuestion) {
  return z
    .string()
    .trim()
    .min(question.minLength, `Digite pelo menos ${question.minLength} caracteres.`)
    .max(question.maxLength, `Digite no máximo ${question.maxLength} caracteres.`);
}

function instagramAnswerSchema() {
  return z
    .string()
    .trim()
    .min(1, "Informe o Instagram da empresa.")
    .transform((raw, ctx) => {
      const normalized = normalizeInstagram(raw);
      if (!normalized) {
        ctx.addIssue("Informe um usuário de Instagram válido.");
        return z.NEVER;
      }
      return normalized;
    });
}

function phoneAnswerSchema() {
  return z
    .object({
      input: z.string().trim().min(1, "Informe o WhatsApp."),
      country: z.string().min(2, "País inválido."),
    })
    .transform((value, ctx) => {
      const normalized = normalizePhone(value.input, value.country);
      if (!normalized) {
        ctx.addIssue("Informe um número de WhatsApp válido.");
        return z.NEVER;
      }
      return normalized;
    });
}

function choiceAnswerSchema(question: ChoiceQuestion) {
  const allowedValues = question.options.map((option) => option.value);
  return z.string().refine((value) => allowedValues.includes(value), {
    message: "Selecione uma das opções disponíveis.",
  });
}

export function validateAnswer(
  question: TextQuestion,
  rawValue: string,
): z.ZodSafeParseResult<string>;
export function validateAnswer(
  question: InstagramQuestion,
  rawValue: string,
): z.ZodSafeParseResult<InstagramAnswer>;
export function validateAnswer(
  question: PhoneQuestion,
  rawValue: PhoneRawInput,
): z.ZodSafeParseResult<PhoneAnswer>;
export function validateAnswer(
  question: ChoiceQuestion,
  rawValue: string,
): z.ZodSafeParseResult<string>;
export function validateAnswer(question: Question, rawValue: unknown) {
  switch (question.type) {
    case "text":
      return textAnswerSchema(question).safeParse(rawValue);
    case "instagram":
      return instagramAnswerSchema().safeParse(rawValue);
    case "phone":
      return phoneAnswerSchema().safeParse(rawValue);
    case "choice":
      return choiceAnswerSchema(question).safeParse(rawValue);
  }
}
