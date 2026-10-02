# Controle de Devoluções — SINTA-SE LINDA & Galpão Utilidades

App web para controle diário de devoluções das duas lojas, com dados
compartilhados entre todos os usuários (antes ficavam só no navegador de
cada pessoa).

## Como rodar localmente (Mac)

```bash
npm install
cp .env.example .env
# edite o .env e defina uma senha em APP_PASSWORD
npm run build:css
npm start
```

Acesse `http://localhost:3000` — vai pedir a senha definida em `APP_PASSWORD`.

Para desenvolvimento com reinício automático: `npm run dev`.
Para recompilar o CSS enquanto edita: `npm run watch:css`.

## Testes

```bash
npm test              # backend (node:test + supertest)
npx playwright test   # front-end (precisa do servidor rodando em :3000)
```

## Arquitetura

- `server.js` — ponto de entrada, carrega `.env` e inicia o Express.
- `src/db.js` — conexão SQLite (`better-sqlite3`) e schema.
- `src/repository.js` — regras de negócio (incrementos por delta, favoritos,
  importação de dados antigos, resumo mensal).
- `src/auth.js` — login com senha única e cookie assinado (`httpOnly`).
- `src/util.js` — validação, normalização de nomes de produto, data local.
- `public/` — front-end estático (HTML + `app.js` puro + Tailwind compilado).
- `legacy/app-antigo.html` — versão original (localStorage, sem backend),
  mantida só como referência histórica.

## Variáveis de ambiente (`.env`)

| Variável       | Descrição                                      |
|----------------|--------------------------------------------------|
| `PORT`         | Porta do servidor (padrão 3000)                  |
| `APP_PASSWORD` | Senha única de acesso ao app (obrigatória fora de `NODE_ENV=development`) |
| `DATA_DIR`     | Pasta onde o banco SQLite é salvo (padrão `./data`) |
| `TZ`           | Fuso horário usado para "hoje" (padrão `America/Sao_Paulo`) |

## Migração dos dados antigos

Se alguém já usava a versão antiga (dados no `localStorage` do navegador), ao
abrir o app aparece um aviso oferecendo importar esses dados para o servidor.
A importação é feita por soma (não sobrescreve), então pode ser executada
mais de uma vez sem duplicar quantidades incorretamente — mas evite clicar
duas vezes de propósito, pois cada clique soma de novo os valores daquele
navegador.

## Publicando com ngrok

```bash
ngrok http 3000
```

O link público exige a senha do `APP_PASSWORD`. Mantenha o Mac ligado e os
dois processos (`npm start` e `ngrok`) abertos enquanto outras pessoas
estiverem usando o app.
