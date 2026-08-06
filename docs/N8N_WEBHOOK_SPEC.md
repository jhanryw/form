# Especificação do webhook para o n8n

Este documento descreve exatamente o que o formulário envia ao workflow do
n8n configurado em `N8N_FORM_WEBHOOK_URL`, para que o workflow saiba como
identificar a sessão, evitar duplicações e decidir o que fazer com cada
evento.

O navegador **nunca** fala diretamente com o n8n. O fluxo é sempre:

```
Navegador → POST /api/forms/progress (Next.js) → webhook privado do n8n
```

A rota interna valida o payload (Zod, `.strict()`), aplica rate limit e só
então repassa ao n8n com o header de autenticação. Se `N8N_FORM_WEBHOOK_URL`
ou `N8N_FORM_WEBHOOK_SECRET` não estiverem configurados, a rota responde
`500` sem nunca expor a URL do n8n ao cliente.

## Autenticação

Toda chamada ao webhook do n8n chega com o header:

```
X-Qarvon-Webhook-Secret: <valor de N8N_FORM_WEBHOOK_SECRET>
```

O workflow do n8n deve validar esse header antes de processar qualquer
payload e rejeitar (401/403) requisições sem o segredo correto.

## Identificadores principais

| Campo | Papel |
| --- | --- |
| `session_id` | Identificador **principal da jornada**. Todas as atualizações de uma mesma pessoa preenchendo o formulário usam o mesmo `session_id` — é a chave que o n8n deve usar para fazer *upsert* do lead (atualizar o mesmo registro em vez de criar um novo a cada etapa). |
| `event_id` | Identificador **de idempotência do evento**. É determinístico: reenviar o mesmo evento (retry) sempre produz o mesmo `event_id`. Use-o para não processar duas vezes a mesma atualização. |
| `form.id` / `form.slug` | Identificam **qual formulário/nicho** gerou o evento. Nunca dependa só das UTMs para isso — elas servem para atribuição de campanha, não para saber qual formulário foi usado. |
| `form.version` | Versão da configuração do formulário no momento do envio (ex.: `"1.0.0"`), útil para saber que copy/regras estavam ativas quando o lead respondeu. |

### Formato do `event_id`

```
progress:{session_id}:{step_id}      # uma atualização de etapa (form_progress)
qualified:{session_id}               # lead qualificado
disqualified:{session_id}:{motivo}   # lead desqualificado
calendar:{session_id}                # clique em "Escolher meu horário"
```

Como o `event_id` é sempre o mesmo para o mesmo tipo de atualização dentro
da mesma sessão, um retry (por falha de rede, timeout, etc.) chega ao n8n
com o **mesmo** `event_id` — trate isso como "salvar/atualizar", nunca como
"inserir mais um registro".

## Headers recebidos

```
Content-Type: application/json
X-Qarvon-Webhook-Secret: <segredo>
```

## Tipos de evento (`event_type`)

| `event_type` | Quando é enviado |
| --- | --- |
| `form_progress` | Após cada resposta confirmada, enquanto o lead ainda está respondendo perguntas. |
| `form_qualified` | Assim que a última pergunta é respondida sem desqualificar o lead. O formulário só mostra a tela dos "98%" depois que este evento é confirmado com sucesso. |
| `form_disqualified` | Quando o lead é desqualificado (faturamento baixo ou investimento recusado). |
| `calendar_redirect` | Quando o lead clica em "Escolher meu horário", antes de ser redirecionado ao Cal.com. |

Os eventos `form_viewed`/`form_started` mencionados em versões anteriores
deste projeto **ainda não são implementados** — ficam para quando o Meta
Pixel/atribuição completa evoluir para incluir também o lado servidor.

## Status possíveis (`status`)

| `status` | Significado |
| --- | --- |
| `started` | Sessão na capa, ainda não iniciou as perguntas. |
| `in_progress` | Respondendo perguntas. |
| `qualified` | Terminou as perguntas sem ser desqualificado. |
| `disqualified` | Desqualificado. |
| `redirected_to_calendar` | Especial: usado **apenas** no evento `calendar_redirect`, independente do estado interno do formulário (que continua sendo "qualified" internamente). |

## `contactable`

```json
"contactable": true | false
```

`true` **somente** quando `answers.whatsapp` já existe (número E.164
válido). Enquanto `false`, trate a sessão como uma **jornada em
andamento** — nunca como um lead pronto para contato via WhatsApp. Isso
evita que automações de disparo de mensagem rodem antes de existir um
número válido.

## Payload completo

```json
{
  "event_id": "progress:3f057f43-2f77-451d-9b21-494804c36fbe:name",
  "event_type": "form_progress",
  "session_id": "3f057f43-2f77-451d-9b21-494804c36fbe",
  "form": {
    "id": "trafego-generico",
    "slug": "trafego",
    "niche": "Genérico",
    "version": "1.0.0",
    "page_url": "https://form.qarvon.com/trafego"
  },
  "status": "in_progress",
  "contactable": false,
  "qualification": {
    "status": "pending",
    "disqualification_reason": null
  },
  "progress": {
    "current_step_id": "instagram",
    "current_step_index": 1,
    "last_completed_step_id": "name"
  },
  "answers": {
    "name": "Maria Souza",
    "instagram": { "raw": "@maria.ads", "username": "maria.ads", "url": "https://instagram.com/maria.ads" },
    "whatsapp": {
      "country": "BR",
      "country_code": "55",
      "national_number": "84988887777",
      "e164": "+5584988887777",
      "display": "(84) 98888-7777"
    },
    "monthly_revenue": "50k_to_100k",
    "accepted_media_investment": "accepted",
    "meeting_availability": "today"
  },
  "attribution": {
    "utm_source": "facebook",
    "utm_medium": "cpc",
    "utm_campaign": "campanha_x",
    "utm_content": null,
    "utm_term": null,
    "fbclid": "AbCdEf123",
    "gclid": null,
    "ttclid": null,
    "fbp": "fb.1.1699999999999.123456789",
    "fbc": "fb.1.1699999999999.AbCdEf123",
    "referrer": "https://www.instagram.com/",
    "landing_page": "https://form.qarvon.com/trafego?utm_source=facebook&utm_medium=cpc"
  },
  "metadata": {
    "started_at": "2026-08-06T00:14:22.564Z",
    "updated_at": "2026-08-06T00:16:24.707Z",
    "completed_at": null,
    "duration_seconds": null,
    "timezone": "America/Fortaleza",
    "language": "pt-BR",
    "user_agent": "Mozilla/5.0 (...)"
  }
}
```

Antes de `whatsapp`/`instagram` serem respondidos, esses campos vêm como
`null` — nunca omitidos (o schema é `.strict()`: campos inesperados ou
ausentes fazem a rota interna rejeitar o payload com `400`).

`completed_at`/`duration_seconds` só deixam de ser `null` em eventos
terminais (`form_qualified`, `form_disqualified`, `calendar_redirect`).

## Como tratar cada evento no n8n

### `form_progress`
- Faça *upsert* pelo `session_id`.
- Atualize os campos de `answers` recebidos até aqui — não assuma que
  todas as respostas já existem.
- Se `contactable` for `false`, não dispare nenhuma automação de
  WhatsApp para esse registro ainda.

### `form_qualified`
- Marque o lead como qualificado.
- Essa é a primeira vez que **todas** as respostas (inclusive
  `meeting_availability`) estarão preenchidas.
- Responda `{ "success": true }` — o formulário só mostra a tela final ao
  usuário depois de receber essa confirmação. Se o n8n não responder a
  tempo (timeout de 8s do lado do Next.js) ou responder com erro, o
  formulário **tenta de novo automaticamente** com o mesmo `event_id`.

### `form_disqualified`
- Marque o lead como desqualificado, registrando
  `qualification.disqualification_reason` (`revenue_below_30000` ou
  `minimum_media_investment_rejected`) internamente.
- **Nunca** exponha esse motivo de volta ao usuário — ele já não aparece
  em nenhuma tela do formulário.

### `calendar_redirect`
- Registre que o lead clicou para abrir a agenda (`status:
  "redirected_to_calendar"`).
- Isso **não** significa que uma reunião foi marcada — é só a intenção de
  agendar. A confirmação real de agendamento (webhook do Cal.com) é um
  recurso futuro, fora do escopo atual.
- Pode ser reenviado com o mesmo `event_id` se o usuário clicar de novo
  (ex.: abriu a agenda, voltou, clicou de novo) — trate como
  idempotente, não como múltiplos cliques.

## Como montar uma mensagem de WhatsApp

Use sempre `answers.whatsapp.e164` (formato `+5584988887777`) como o
valor principal para qualquer automação de envio. Os demais campos do
objeto (`display`, `country_code`, `national_number`) são só para exibição
em telas/planilhas.

```
Olá {{answers.name}}! Vi que você tem interesse em {{form.niche}}...
```

## Salvando em uma planilha (Google Sheets) — futuro

Quando essa integração for implementada, recomenda-se:
- Usar `session_id` como chave de linha (uma linha por sessão, atualizada
  a cada evento — não uma linha por evento).
- Gravar `event_id` do último evento processado numa coluna auxiliar, para
  detectar e ignorar reprocessamentos do mesmo evento vindos de retries.
- Nunca gravar `qualification.disqualification_reason` em uma coluna
  visível para quem faz contato comercial com o lead.

## Limites e validação

- Corpo máximo aceito pela rota interna: 20 KB.
- Rate limit: 30 requisições por IP a cada 60 segundos, **em memória, por
  instância** — reinicia a cada deploy e não é compartilhado entre
  réplicas. Adequado para a V1 (uma única instância); antes de escalar
  horizontalmente, substituir por um store compartilhado.
- Timeout da chamada ao n8n: 8 segundos. Depois disso a rota interna
  responde `504` ao navegador, que mantém o evento na fila local e tenta
  de novo automaticamente.
