# Warthex-Bot

Bot Bedrock para manter o servidor **Obsidian Orb** (Falix) online 24/7.

Fica parado e só olha de vez em quando — conta como jogador ativo.

## Render

1. Cria um **Web Service** ligado a este repo
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Environment variables:

```
MC_HOST=obsidianorb.falix.pro
MC_PORT=21188
MC_USERNAME=WarthexBot_24h
MC_OFFLINE=true
MC_VERSION=1.21.130
```

5. Deploy

Quando a Falix mudar a porta, altera só `MC_PORT` e faz deploy outra vez.

## Local

```bash
npm install
cp .env.example .env
npm start
```
