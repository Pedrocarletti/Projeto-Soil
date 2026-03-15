# Deploy Oracle + Vercel

Este fluxo e o mais simples para usar o frontend na Vercel e deixar somente a
API na Oracle Cloud.

## 1. O que este deploy sobe

O arquivo `docker-compose.api.prod.yml` sobe:

- Traefik com HTTPS automatico
- API NestJS
- PostgreSQL
- Redis
- Mosquitto

O frontend continua hospedado na Vercel.

## 2. Requisitos

- Uma VM Linux publica na Oracle Cloud
- Portas `80` e `443` liberadas na Oracle e no firewall da VM
- Um dominio publico apontando para a VM
- Docker e Docker Compose instalados

## 3. Configurar variaveis

Na raiz do projeto:

```bash
cp .env.api.example .env
```

Edite `.env` e preencha:

- `API_DOMAIN`: dominio da API, por exemplo `soilpedro.duckdns.org`
- `FRONTEND_URL`: URL publica do frontend na Vercel
- `ACME_EMAIL`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Exemplo:

```env
API_DOMAIN=soilpedro.duckdns.org
FRONTEND_URL=https://projeto-soil.vercel.app
ACME_EMAIL=voce@gmail.com
POSTGRES_PASSWORD=troque-por-uma-senha-forte
JWT_SECRET=troque-por-um-segredo-longo-e-unico
SEED_ADMIN_NAME=Administrador Soil
SEED_ADMIN_EMAIL=admin@soil.local
SEED_ADMIN_PASSWORD=troque-por-uma-senha-forte
```

## 4. Subir a API

```bash
docker compose -f docker-compose.api.prod.yml up -d --build
```

## 5. Validar

- API: `https://SEU_API_DOMAIN/api`
- WebSocket: `https://SEU_API_DOMAIN/realtime`

## 6. Configurar a Vercel

No projeto `apps/web` na Vercel, configure:

- `NEXT_PUBLIC_API_URL=https://SEU_API_DOMAIN/api`
- `NEXT_PUBLIC_WS_URL=https://SEU_API_DOMAIN/realtime`

Use `apps/web/.env.vercel.example` como base.

## 7. CD opcional com GitHub Actions

Se quiser manter o deploy automatico para esse fluxo, configure no GitHub:

- `DEPLOY_COMPOSE_FILE=docker-compose.api.prod.yml`

Os outros secrets continuam os mesmos do deploy em VPS descrito em
`docs/deploy-vps.md`.
