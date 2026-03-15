# Deploy em VPS

Este projeto pode ser publicado em uma VPS Linux com Docker usando o arquivo
`docker-compose.prod.yml`. O fluxo abaixo assume um deploy publico com:

- web em `https://soil.seudominio.com`
- API em `https://api.soil.seudominio.com`
- HTTPS automatico via Traefik + Let's Encrypt

Se o frontend ficar na Vercel e voce quiser subir somente a API na VPS, use
`docker-compose.api.prod.yml` e siga `docs/deploy-oracle-vercel.md`.

## 1. Requisitos

- Uma VPS Linux com Docker e Docker Compose instalados
- Portas `80` e `443` liberadas no firewall
- Dois registros DNS apontando para o IP da VPS:
  - `soil.seudominio.com`
  - `api.soil.seudominio.com`

## 2. Configurar variaveis

Na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha pelo menos:

- `WEB_DOMAIN`
- `API_DOMAIN`
- `ACME_EMAIL`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Observacoes:

- O seed do backend e idempotente. Ele cria ou atualiza o admin informado nas
  variaveis `SEED_ADMIN_*`.
- `NEXT_PUBLIC_DEMO_EMAIL` e `NEXT_PUBLIC_DEMO_PASSWORD` aparecem na tela de
  login. Em producao, deixe ambos vazios a menos que o objetivo seja expor uma
  demo publica.
- Se quiser usar um broker MQTT externo, troque `MQTT_URL` e, se necessario,
  preencha `MQTT_USERNAME` e `MQTT_PASSWORD`.

## 3. Subir a stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 4. Validar

Depois do deploy:

- Web: `https://SEU_WEB_DOMAIN`
- API: `https://SEU_API_DOMAIN/api`

O login usa a credencial configurada em `SEED_ADMIN_EMAIL` e
`SEED_ADMIN_PASSWORD`.

## 5. Atualizar

Depois de novos commits:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 6. Habilitar GitHub Actions CD

O repositorio inclui um workflow de deploy automatico em
`.github/workflows/cd.yml`. Para ativar esse fluxo, configure os seguintes
secrets no GitHub:

- `DEPLOY_HOST`: IP ou dominio da VPS
- `DEPLOY_PORT`: porta SSH, opcional, padrao `22`
- `DEPLOY_USER`: usuario SSH da VPS
- `DEPLOY_SSH_KEY`: chave privada usada para acessar a VPS
- `DEPLOY_PATH`: pasta onde o projeto ficara na VPS, por exemplo
  `/opt/projeto-soil`
- `DEPLOY_ENV_FILE`: conteudo completo do arquivo `.env` de producao
- `DEPLOY_COMPOSE_FILE`: opcional, permite usar um compose alternativo como
  `docker-compose.api.prod.yml`

Com esses secrets configurados, cada push em `main` executa:

1. conexao SSH na VPS
2. sincronizacao do repositorio em `DEPLOY_PATH`
3. escrita do `.env` remoto
4. `bash scripts/deploy-prod.sh`

## Notas

- PostgreSQL, Redis e Mosquitto ficam internos na rede Docker por padrao.
- Se precisar aceitar dispositivos MQTT externos diretamente na VPS, exponha a
  porta `1883` do servico `mosquitto` e ajuste firewall e seguranca antes.
- O WebSocket agora exige o mesmo JWT usado pelo frontend, entao o canal de
  tempo real nao fica publico ao publicar o projeto.
