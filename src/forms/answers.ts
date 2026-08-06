export interface InstagramAnswer {
  raw: string;
  username: string;
  url: string;
}

export interface PhoneAnswer {
  country: string;
  countryCode: string;
  nationalNumber: string;
  e164: string;
  display: string;
}

export type AnswerValue = string | InstagramAnswer | PhoneAnswer;

export type Answers = Record<string, AnswerValue>;
