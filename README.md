# Soil Pivot Challenge

MVP fullstack para automacao e monitoramento de pivos centrais de irrigacao.

## Stack

- `apps/web`: Next.js 16, React 19, Tailwind CSS, Socket.IO client
- `apps/api`: NestJS 11, Prisma, PostgreSQL, Redis/BullMQ, MQTT, WebSocket
- Infra local: Docker Compose, Traefik, PostgreSQL, Redis, Mosquitto

## Funcionalidades implementadas

- Autenticacao JWT com usuarios e roles
- Seed inicial com usuario admin
- Cadastro e listagem de fazendas, pivos e usuarios no backend
- Dashboard web com cards de status e busca
- Tela detalhada do pivo com controle remoto, historico e clima
- Processamento de telemetria por fila Redis
- Assinatura MQTT e atualizacao em tempo real via WebSocket
- Dockerizacao completa com roteamento Traefik

## Credencial seeded local

- `admin@soil.local`
- `soil123456`

Essa credencial continua sendo o padrao local. Em deploy publico, o admin e
configurado por `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`.

## Subir tudo localmente com Docker

```bash
docker compose up --build
```

Acessos:

- Web: `http://localhost`
- API: `http://api.localhost/api`
- Traefik dashboard: `http://traefik.localhost` ou `http://localhost:8080`

## Desenvolvimento local

Backend:

```bash
cd apps/api
cp .env.example .env
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm seed
pnpm start:dev
```

Frontend:

```bash
cd apps/web
cp .env.example .env.local
pnpm install
pnpm dev
```

Para desenvolvimento local sem Traefik, o frontend deve apontar para o Nest em
`http://localhost:33001`. O arquivo `apps/web/.env.example` ja traz essa
configuracao e tambem preenche a credencial demo local. No build Docker, a
imagem do frontend sobrescreve a URL da API para `http://api.localhost`.

Dependencias locais:

- PostgreSQL em `localhost:5432`
- Redis em `localhost:6379`
- Broker MQTT em `localhost:1883`

Portas expostas pelo `docker compose`:

- PostgreSQL: `localhost:55432`
- Redis: `localhost:56379`
- MQTT: `localhost:51883`

## Simular telemetria

Com o broker local ativo:

```bash
cd apps/api
MQTT_URL=mqtt://localhost:51883 pnpm simulate:telemetry
```

Por padrao o script publica uma sequencia para `pivot-norte`.

## Publicar em producao

O repositorio agora inclui `docker-compose.prod.yml`, preparado para VPS Linux
com:

- web em dominio proprio
- API em subdominio proprio
- HTTPS automatico com Traefik + Let's Encrypt
- admin seeded configurado por variaveis de ambiente
- WebSocket autenticado com o mesmo JWT do frontend

Passo rapido:

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
```

Preencha antes no `.env`:

- `WEB_DOMAIN`
- `API_DOMAIN`
- `ACME_EMAIL`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Guia completo: `docs/deploy-vps.md`

## Frontend na Vercel

Para publicar o frontend na Vercel:

- importe o repositorio normalmente
- configure `Root Directory` como `apps/web`
- configure `NEXT_PUBLIC_API_URL`
- configure `NEXT_PUBLIC_WS_URL`

Use `apps/web/.env.vercel.example` como base.

Guia completo: `docs/deploy-vercel.md`

## CI/CD

O projeto agora inclui dois workflows em GitHub Actions:

- `CI`: lint, build de `apps/web` e `apps/api`, e validacao dos arquivos
  `docker-compose.yml` e `docker-compose.prod.yml`
- `CD`: deploy automatico para VPS via SSH em push para `main` ou execucao
  manual

Para habilitar o deploy automatico, configure estes secrets no repositorio:

- `DEPLOY_HOST`
- `DEPLOY_PORT` (opcional, padrao `22`)
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- `DEPLOY_ENV_FILE`

`DEPLOY_ENV_FILE` deve conter o conteudo completo do `.env` de producao.

## Notas

- O contrato de pacote MQTT adotado no projeto esta em `docs/packets.md`.
- A previsao do tempo usa `Open-Meteo` como alternativa ao WeatherKit para manter o projeto executavel sem credenciais externas.
- O fluxo AWS IoT Core foi abstraido por MQTT generico; para ambiente real basta apontar `MQTT_URL` e credenciais do broker gerenciado.
