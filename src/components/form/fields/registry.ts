import type { ComponentType } from "react";
import type { Question } from "@/forms";
import { TextFieldQuestion } from "./TextFieldQuestion";
import { InstagramFieldQuestion } from "./InstagramFieldQuestion";
import { PhoneFieldQuestion } from "./PhoneFieldQuestion";
import { ChoiceFieldQuestion } from "./ChoiceFieldQuestion";
import type { FieldComponentProps } from "./types";

/**
 * Mapa único entre o tipo de pergunta e o componente que a renderiza.
 * Adicionar um novo tipo (email, textarea, select, etc.) exige apenas:
 * 1) estender a union `Question`; 2) adicionar o caso em validation/schemas.ts;
 * 3) criar o componente; 4) registrar aqui. O FormRunner/QuestionScreen não mudam.
 */
export const fieldComponents: Record<Question["type"], ComponentType<FieldComponentProps>> = {
  text: TextFieldQuestion,
  instagram: InstagramFieldQuestion,
  phone: PhoneFieldQuestion,
  choice: ChoiceFieldQuestion,
};
