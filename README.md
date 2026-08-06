# Qarvon — Formulários de qualificação de leads

Aplicação Next.js que hospeda formulários multi-etapa por nicho
(`form.qarvon.com/<slug>`) para captar empresas interessadas em contratar
gestão de tráfego pago. Cada nicho é um arquivo de configuração — não um
projeto separado.

## Stack

- Next.js (App Router) + React + TypeScript (`strict`)
- Tailwind CSS + fonte Lato
- Zod (validação client e server)
- `libphonenumber-js` (telefone internacional)
- Sem banco de dados, sem Prisma/Supabase/Firebase — todo o progresso do
  usuário vive no `localStorage` do navegador (TTL de 24h) e é replicado
  para o n8n via webhook

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000/trafego](http://localhost:3000/trafego) — esse
é o formulário genérico de validação. A raiz (`/`) não é um formulário.

### Verificações antes de qualquer commit/deploy

```bash
npm run lint
npm run typecheck
npm run build
```

Todas as três devem passar sem erros. `npm run build` também roda a
checagem de tipos do Next.js.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SITE_URL=https://form.qarvon.com
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_CALCOM_URL=

N8N_FORM_WEBHOOK_URL=
N8N_FORM_WEBHOOK_SECRET=
```

| Variável | Pública? | Obrigatória? | Efeito se ausente |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Sim | Não | Reservada para uso futuro (ex.: metadados de SEO) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Sim | Não | Nenhum script do Meta Pixel é carregado; o formulário funciona normalmente |
| `NEXT_PUBLIC_CALCOM_URL` | Sim | Não | O botão final mostra uma mensagem amigável em vez de redirecionar |
| `N8N_FORM_WEBHOOK_URL` | **Não** | Sim (para o webhook funcionar) | A rota `/api/forms/progress` responde erro; as respostas continuam salvas no navegador e são reenviadas quando a variável existir |
| `N8N_FORM_WEBHOOK_SECRET` | **Não** | Sim (junto da anterior) | Idem |

As variáveis `NEXT_PUBLIC_*` são embutidas no bundle do navegador **no
momento do build** — isso é esperado e não é um vazamento de segredo,
porque nenhuma delas é sensível. `N8N_FORM_WEBHOOK_URL` e
`N8N_FORM_WEBHOOK_SECRET` nunca são lidas fora de
`src/app/api/forms/progress/route.ts` (que roda só no servidor) e não
existem no bundle do navegador — não coloque nenhuma URL/segredo privado
atrás de um nome `NEXT_PUBLIC_*`.

Nunca commite `.env` ou `.env.local` (já estão no `.gitignore`).

## Como adicionar um novo nicho

Todos os formulários compartilham o mesmo código — o que muda é só um
arquivo de configuração em `src/forms/`.

1. **Duplique o arquivo de exemplo**: copie `src/forms/trafego.ts` para
   `src/forms/<novo-slug>.ts` (ex.: `src/forms/oticas.ts`).
2. **Altere o `slug`**: esse valor define a URL —
   `slug: "oticas"` fica acessível em `form.qarvon.com/oticas`.
3. **Altere `id` e `niche`**: `id` é o identificador estável enviado ao
   webhook (ex.: `"trafego-oticas"`); `niche` é o nome exibido/enviado
   (ex.: `"Óticas"`).
4. **Altere a copy da capa** (`cover`): `headline`, `subtitle`, `bullets`,
   `qualificationFooter`, `buttonText`.
5. **Altere as cores** (`theme.primaryColor`, `primaryColorHover`,
   `onPrimaryColor`) — são aplicadas via CSS custom properties, nenhum
   componente precisa mudar.
6. **Altere as perguntas** (`questions`): adicione, remova ou reordene
   itens do array. Os tipos disponíveis hoje são `text`, `instagram`,
   `phone` e `choice` (veja `src/forms/types.ts`).
7. **Configure as regras de qualificação**: em uma pergunta `choice`,
   marque a alternativa que deve desqualificar com
   `disqualifies: true` e um `disqualificationReason` (string enviada ao
   webhook, nunca mostrada ao usuário). Não é preciso tocar em nenhum
   componente — a state machine (`src/lib/machine/qualification.ts`) lê
   isso diretamente da configuração.
8. **Altere os textos finais** (`disqualifiedScreen`, `qualifiedScreen`).
9. **Registre o novo formulário** em `src/forms/index.ts`, adicionando
   `[novoForm.slug]: novoForm` ao objeto `forms`.
10. **Teste**: rode `npm run dev` e abra
    `http://localhost:3000/<novo-slug>`. Preencha o fluxo completo pelo
    menos uma vez qualificando e uma vez desqualificando.
11. **Publique**: `npm run lint && npm run typecheck && npm run build`,
    depois siga o fluxo normal de commit/push/deploy descrito abaixo.

Um slug que não existir em `src/forms/index.ts` mostra a página 404 padrão
do Next.js — não é preciso criar nada manualmente para isso.

## Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://form.qarvon.com \
  --build-arg NEXT_PUBLIC_META_PIXEL_ID= \
  --build-arg NEXT_PUBLIC_CALCOM_URL= \
  -t qarvon-form .

docker run --rm -p 3000:3000 \
  -e N8N_FORM_WEBHOOK_URL=https://seu-n8n/webhook/xxxx \
  -e N8N_FORM_WEBHOOK_SECRET=um-segredo-forte \
  qarvon-form
```

- Build multi-stage com `output: "standalone"` — a imagem final não
  contém `node_modules` completo, só o necessário para rodar.
- O processo roda como usuário não-root (`nextjs`, uid 1001).
- As variáveis `NEXT_PUBLIC_*` são passadas como `--build-arg` (precisam
  existir no momento do build, pois são embutidas no bundle). As
  variáveis privadas (`N8N_*`) são passadas como `-e` no `docker run` —
  nunca em `ARG`/`ENV` do estágio de build, para não ficarem gravadas em
  nenhuma camada da imagem.
- Health check embutido (`HEALTHCHECK` no Dockerfile) chama
  `GET /api/health` a cada 30s.

## GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<sua-org>/<seu-repo>.git
git push -u origin main
```

Use `main` como branch principal — é a branch que o EasyPanel vai
acompanhar para deploy automático.

## EasyPanel

1. **Criar novo serviço** → tipo "App" (a partir de um repositório Git).
2. **Conectar ao GitHub** e autorizar o acesso ao repositório.
3. **Selecionar o repositório** e a **branch** `main`.
4. **Build**: o EasyPanel detecta o `Dockerfile` automaticamente (build
   type "Dockerfile"). Não é necessário configurar um buildpack.
5. **Variáveis de ambiente**: cadastre todas as variáveis de
   `.env.example` com os valores reais de produção — incluindo as
   `NEXT_PUBLIC_*`, que o EasyPanel deve repassar como `--build-arg`
   durante o build (confira a opção "Build Args" do serviço; se o
   EasyPanel só suportar variáveis de runtime, mova as `NEXT_PUBLIC_*`
   para a seção de build do serviço).
6. **Porta**: `3000` (a mesma exposta no `Dockerfile`/`EXPOSE 3000`).
7. **Domínio**: configure `form.qarvon.com` apontando para o serviço;
   ative HTTPS (Let's Encrypt automático do EasyPanel).
8. **Health check**: caminho `/api/health`, método `GET`, resposta
   esperada `200`.
9. **Primeiro deploy**: acione o deploy manual a partir do painel. Deploys
   seguintes acontecem automaticamente a cada push em `main` (se o
   deploy automático estiver ativado no serviço).
10. **Verificar logs**: aba "Logs" do serviço no EasyPanel mostra a saída
    do `node server.js` em tempo real — use para confirmar que o
    container subiu e que não há erros de variável de ambiente ausente.
11. **Rollback**: na aba "Deployments" do serviço, cada deploy anterior
    fica listado com a opção "Rollback" — isso reaponta o serviço para a
    imagem/commit anterior sem precisar reverter o Git.

## Documentação do webhook (n8n)

Veja [`docs/N8N_WEBHOOK_SPEC.md`](docs/N8N_WEBHOOK_SPEC.md) para o formato
completo do payload, tipos de evento, idempotência e como o n8n deve
identificar e atualizar cada lead.

## Segurança (resumo)

- Validação client-side (Zod) e server-side (Zod `.strict()`, a rota
  interna nunca confia no payload do navegador).
- Rate limit básico em memória (30 req/min por IP) — reinicia a cada
  deploy/restart e não é compartilhado entre réplicas; antes de escalar
  horizontalmente, trocar por um store compartilhado.
- Timeout de 8s nas chamadas ao n8n; a URL/segredo do n8n nunca chegam ao
  navegador.
- CAPTCHA não implementado nesta versão. Para adicionar Cloudflare
  Turnstile futuramente: renderizar o widget na capa do formulário,
  enviar o token junto do primeiro evento de progresso, e validá-lo em
  `src/app/api/forms/progress/route.ts` antes de repassar ao n8n.
