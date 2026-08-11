import type { FormConfig } from "./types";
import { trafegoForm } from "./sofa";
import { trafegoPorcelanatoForm } from "./porcelanato";

const forms: Record<string, FormConfig> = {
  [trafegoForm.slug]: trafegoForm,
  [trafegoPorcelanatoForm.slug]: trafegoPorcelanatoForm,
};

export function getFormBySlug(slug: string): FormConfig | undefined {
  return forms[slug];
}

export type {
  FormConfig,
  Question,
  TextQuestion,
  InstagramQuestion,
  PhoneQuestion,
  ChoiceQuestion,
  ChoiceOption,
  FormTheme,
} from "./types";

export type {
  Answers,
  AnswerValue,
  InstagramAnswer,
  PhoneAnswer,
} from "./answers";