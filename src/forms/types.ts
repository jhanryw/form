export interface FormTheme {
  /** Cor principal de botões e destaques. */
  primaryColor: string;
  /** Cor do botão principal ao passar o mouse/pressionar. */
  primaryColorHover: string;
  /** Cor de texto sobre a cor principal (contraste do botão). */
  onPrimaryColor: string;
}

export interface ChoiceOption {
  label: string;
  value: string;
  /** Quando true, selecionar esta opção desqualifica o lead imediatamente. */
  disqualifies?: boolean;
  /** Motivo salvo em `qualification.disqualification_reason` quando `disqualifies` é true. */
  disqualificationReason?: string;
}

interface BaseQuestion {
  id: string;
  /** Pergunta exibida na tela. */
  question: string;
  /** Texto explicativo exibido acima da pergunta (ex.: aviso de investimento mínimo). */
  helperText?: string;
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
  minLength: number;
  maxLength: number;
}

export interface InstagramQuestion extends BaseQuestion {
  type: "instagram";
}

export interface PhoneQuestion extends BaseQuestion {
  type: "phone";
  /** Código ISO do país padrão, ex.: "BR". */
  defaultCountry: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: "choice";
  options: ChoiceOption[];
}

export type Question =
  | TextQuestion
  | InstagramQuestion
  | PhoneQuestion
  | ChoiceQuestion;

export interface FormConfig {
  /** Identificador estável do formulário, usado nos payloads (ex.: "trafego-oticas"). */
  id: string;
  /** Slug da URL, ex.: "oticas" para form.qarvon.com/oticas. */
  slug: string;
  /** Nome do nicho exibido internamente e enviado ao webhook. */
  niche: string;
  /** Versão da configuração, enviada no payload para rastrear mudanças de copy/regras. */
  version: string;
  theme: FormTheme;
  cover: {
    headline: string;
    subtitle: string;
    bullets: string[];
    qualificationFooter: string;
    buttonText: string;
  };
  questions: Question[];
  disqualifiedScreen: {
    title: string;
    body: string;
    /** Reservado: CTA alternativo para desqualificados (ex.: outro produto/conteúdo). Não usado ainda. */
    ctaText?: string;
  };
  qualifiedScreen: {
    title: string;
    body: string;
    buttonText: string;
  };
}
