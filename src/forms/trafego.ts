import type { FormConfig } from "./types";

export const trafegoForm: FormConfig = {
  id: "trafego-generico",
  slug: "trafego",
  niche: "Genérico",
  version: "1.0.0",
  theme: {
    primaryColor: "#111827",
    primaryColorHover: "#1f2937",
    onPrimaryColor: "#ffffff",
  },
  cover: {
    headline: "🚀 Quer vender mais usando anúncios?",
    subtitle:
      "Responda algumas perguntas rápidas para entendermos o seu cenário e mostrarmos como podemos ajudar. 📋",
    bullets: [
      "📈 Mais oportunidades de venda",
      "🎯 Anúncios para o público certo",
      "📲 Mais contatos no WhatsApp",
      "🏆 Estratégia focada em resultado",
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
        { label: "Até R$ 15 mil", value: "up_to_15k", disqualifies: true, disqualificationReason: "revenue_below_30000" },
        { label: "De R$ 15 mil a R$ 30 mil", value: "15k_to_30k", disqualifies: true, disqualificationReason: "revenue_below_30000" },
        { label: "De R$ 30 mil a R$ 50 mil", value: "30k_to_50k" },
        { label: "De R$ 50 mil a R$ 100 mil", value: "50k_to_100k" },
        { label: "De R$ 100 mil a R$ 300 mil", value: "100k_to_300k" },
        { label: "De R$ 300 mil a R$ 500 mil", value: "300k_to_500k" },
        { label: "Acima de R$ 500 mil", value: "above_500k" },
      ],
    },
    {
      id: "accepted_media_investment",
      type: "choice",
      question: "Você está de acordo com esse investimento?",
      helperText:
        "Para executar uma estratégia com volume suficiente de dados, recomendamos um investimento mínimo de R$ 100 por dia em anúncios, aproximadamente R$ 3.000 por mês. Esse valor é destinado diretamente às plataformas de anúncios e não inclui a prestação de serviço da Qarvon.",
      options: [
        { label: "Estou disposto a investir pelo menos R$ 100 por dia", value: "accepted" },
        {
          label: "Não estou disposto a fazer esse investimento",
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
    body: "Agora falta apenas escolher o melhor horário para conversarmos.",
    buttonText: "ESCOLHER MEU HORÁRIO",
  },
};
