# Deploy do Frontend na Vercel

Este repositorio e um monorepo. Na Vercel, o projeto do frontend deve apontar
para `apps/web`.

## Configuracao correta

Ao importar o repositorio na Vercel:

- Framework Preset: `Next.js`
- Root Directory: `apps/web`
- Build Command: deixe o padrao da Vercel ou use `pnpm build`
- Install Command: deixe o padrao da Vercel ou use `pnpm install --frozen-lockfile`

## Variaveis de ambiente

Use como base o arquivo `apps/web/.env.vercel.example`.

Obrigatorias:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

Exemplo:

```env
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com/api
NEXT_PUBLIC_WS_URL=https://api.seu-dominio.com/realtime
```

Opcional:

- `NEXT_PUBLIC_DEMO_EMAIL`
- `NEXT_PUBLIC_DEMO_PASSWORD`

Essas duas aparecem na tela de login. Em producao, o ideal e deixalas vazias.

## Observacoes

- O backend `apps/api` nao deve ser publicado como este mesmo projeto da Vercel.
- A Vercel pode hospedar o frontend, mas a API precisa ficar em uma VPS ou outro
  provedor que suporte PostgreSQL, Redis, MQTT e WebSocket persistente.
- Se `NEXT_PUBLIC_API_URL` nao estiver configurada, o frontend agora falha com
  uma mensagem explicita em vez de tentar `api.localhost`.
