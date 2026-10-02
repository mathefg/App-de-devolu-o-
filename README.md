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

Acesse `http://localhost:3001` — vai pedir a senha definida em `APP_PASSWORD`.

Para desenvolvimento com reinício automático: `npm run dev`.
Para recompilar o CSS enquanto edita: `npm run watch:css`.

## Testes

```bash
npm test              # backend (node:test + supertest)
npx playwright test   # front-end (precisa do servidor rodando em :3001)
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
| `PORT`         | Porta do servidor (padrão 3001)                  |
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

## Colocar no ar com ngrok

1. **Instale o ngrok** (se ainda não tiver): `brew install ngrok`.
2. **Crie um token novo, exclusivo deste projeto**: acesse
   [dashboard.ngrok.com/authtokens](https://dashboard.ngrok.com/authtokens),
   clique em "Add Authtoken" e copie o token gerado. Não reutilize o token de
   outro projeto seu — cada app deve ter o seu.
3. **Preencha o `.env`** desta pasta com o token:
   ```
   NGROK_AUTHTOKEN=seu_token_aqui
   ```
4. **Rode**:
   ```bash
   npm run share
   ```
   Isso sobe o servidor (`node server.js`) e abre o túnel ngrok na mesma
   porta do `.env` (`PORT`, padrão 3001), um na frente do outro no terminal.
   Ctrl+C encerra os dois juntos.

O comando usa só o token deste `.env` — ele nunca roda `ngrok config
add-authtoken` nem toca na configuração global do ngrok (o arquivo
`~/Library/Application Support/ngrok/ngrok.yml` ou equivalente), então não
interfere em outro projeto seu que também use ngrok.

**Link fixo**: se você reservar um domínio grátis no painel do ngrok (seção
*Domains*), coloque-o no `.env` como `NGROK_DOMAIN=seu-dominio.ngrok-free.app`
e o `npm run share` passa a usar esse domínio automaticamente, em vez de
gerar um link novo a cada execução.

**Cuidados**:
- O link só funciona enquanto o Mac estiver ligado e sem dormir, com
  `npm run share` aberto.
- Como o link fica público, a senha em `APP_PASSWORD` é obrigatória — nunca
  deixe o app no ar sem ela.
- Os dados ficam em `data/devolucoes.db`. Faça backup desse arquivo de vez em
  quando (basta copiá-lo).
- Se outro projeto seu já estiver usando a porta 3001 no mesmo Mac ao mesmo
  tempo, mude a `PORT` no `.env` deste projeto para uma porta livre (ex.:
  `3002`) antes de rodar `npm run share`.
