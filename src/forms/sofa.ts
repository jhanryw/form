import type { FormConfig } from "./types";

export const trafegoForm: FormConfig = {
  id: "trafego-generico",
  slug: "trafego",
  niche: "Genérico",
  version: "1.0.0",
  theme: {
    primaryColor: "#A67C52",
    primaryColorHover: "#8F6843",
    onPrimaryColor: "#ffffff",
  },
  cover: {
    headline: "🛋️ Quer vender mais sofás usando Tráfego Pago?",
    subtitle:
      "",
    bullets: [
      "✅ Leads com Potencial Real de Investimento",
      "🎯 Alcance pessoas procurando móveis na sua região",
      "📲 Gere mais contatos no WhatsApp",
      "🏆 Método Validado",
    ],
    qualificationFooter:
      "→ Para empresas que já faturam e estão prontas para investir em crescimento.",
    buttonText: "QUERO VENDER MAIS",
  },
  questions: [
    {
      id: "name",
      type: "text",
      question: "Qual é o seu nome?",
      minLength: 2,
      maxLength: 80,
    },
    {
      id: "whatsapp",
      type: "phone",
      question: "Qual é o seu WhatsApp?",
      defaultCountry: "BR",
    },
    {
      id: "instagram",
      type: "instagram",
      question: "Qual é o Instagram da sua empresa?",
    },
    {
      id: "monthly_revenue",
      type: "choice",
      question: "Qual é o faturamento mensal da sua empresa?",
      options: [
        { label: "Acima de R$ 500 mil", value: "above_500k" },
        { label: "De R$ 300 mil a R$ 500 mil", value: "300k_to_500k" },
        { label: "De R$ 100 mil a R$ 300 mil", value: "100k_to_300k" },
        { label: "De R$ 50 mil a R$ 100 mil", value: "50k_to_100k" },
        { label: "De R$ 30 mil a R$ 50 mil", value: "30k_to_50k" },
        { label: "De R$ 15 mil a R$ 30 mil", value: "15k_to_30k", disqualifies: true, disqualificationReason: "revenue_below_30000" },
        { label: "Até R$ 15 mil", value: "up_to_15k", disqualifies: true, disqualificationReason: "revenue_below_30000" }
        ,
      ],
    },
    {
      id: "accepted_media_investment",
      type: "choice",
      question: "Para gerar volume suficiente de oportunidades, recomendamos um **investimento mínimo de R$ 100 por dia em anúncios** (aproximadamente R$ 3.000 por mês). Esse valor é destinado exclusivamente às plataformas de anúncios e não inclui os honorários da Qarvon.\n\nEsse investimento faz sentido para a sua empresa?",
      options: [
        {
          label: "Sim! Estou pronto para levar o meu negócio para o próximo nível",
          value: "accepted",
        },
        {
          label: "Infelizmente não é o meu momento",
          value: "rejected",
          disqualifies: true,
          disqualificationReason: "minimum_media_investment_rejected",
        },
      ],
    },
    {
      id: "meeting_availability",
      type: "choice",
      question: "Quando você teria disponibilidade para uma conversa pelo Google Meet?",
      options: [
        { label: "Hoje", value: "today" },
        { label: "Amanhã", value: "tomorrow" },
        { label: "Nesta semana", value: "this_week" },
        { label: "Neste mês", value: "this_month" },
        { label: "No próximo mês", value: "next_month" },
      ],
    },
  ],
  disqualifiedScreen: {
    title: "Obrigado pelas informações",
    body: "Iremos avaliar o seu cenário.",
  },
  qualifiedScreen: {
    title: "Seu formulário está 98% preenchido",
    body: "Falta apenas uma etapa para finalizar o formulário.",
    buttonText: "AVANÇAR",
  },
};
