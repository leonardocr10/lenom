# Painel administrativo — Lenom.AI

## Como rodar

```
run.bat
```

Sobe os dois processos juntos (`npm run dev`):

| Serviço | Endereço                    |
| ------- | --------------------------- |
| Site    | http://localhost:4200/      |
| Painel  | http://localhost:4200/admin |
| API     | http://localhost:3333/api   |

Em desenvolvimento o Angular faz proxy de `/api` e `/uploads` para a porta 3333
(`proxy.conf.json`), então o navegador só precisa da 4200.

Para rodar separado: `npm run api` e `npm start`.
Para servir o build pronto pelo próprio Express: `npm run serve:prod` (tudo na 3333).

## Acesso inicial

O primeiro `npm run api` cria o usuário administrador:

- e-mail: `admin@lenom.ai`
- senha: definida em `ADMIN_PASSWORD`; sem essa variável, usa o padrão de desenvolvimento
  `lenom@2026`

**Troque a senha no primeiro acesso** em _Minha conta → Trocar senha_. Em produção,
defina também `JWT_SECRET` e `ADMIN_PASSWORD` antes do primeiro start:

```
set JWT_SECRET=uma-chave-longa-e-aleatoria
set ADMIN_PASSWORD=sua-senha-forte
npm run api
```

## Banco de dados

SQLite via `node:sqlite` (embutido no Node 22.5+), sem dependência nativa.

- arquivo: `server/data/lenom.db`
- uploads: `server/data/uploads/`
- o schema é criado no primeiro start e populado com o conteúdo que estava em
  `src/app/data/content.ts`

Para zerar tudo, apague `server/data/` e reinicie a API.

## O que dá para administrar

| Tela                 | Conteúdo                                                 |
| -------------------- | -------------------------------------------------------- |
| Painel               | indicadores, solicitações por status, últimas entradas   |
| Solicitações         | leads do formulário, status, anotações internas          |
| Planos e preços      | cartões da seção de planos                               |
| Perguntas frequentes | FAQ                                                      |
| Portfólio            | projetos da vitrine                                      |
| Depoimentos          | falas de clientes                                        |
| Capítulos            | narrativa da seção "Como funciona"                       |
| Textos e contato     | contato, opções do formulário e blocos avançados em JSON |
| Mídia                | upload de arquivos até 5 MB, cópia de link, exclusão     |
| Usuários             | contas do painel (somente administradores)               |
| Minha conta          | troca de senha                                           |

Todo grid tem busca, filtros, ordenação por coluna e paginação.

## Perfis

- **admin** — tudo, incluindo usuários e os blocos de "Textos e contato".
- **editor** — conteúdo e solicitações; não vê nem edita usuários, não grava os blocos
  de configuração.

## Como a landing page lê os dados

No boot, `provideAppInitializer` chama `GET /api/content` e sobrepõe os valores padrão
de `src/app/data/content.ts`. Se a API estiver fora, o site continua funcionando com o
conteúdo estático — só não reflete o que foi editado no painel.

Só entra na resposta o que estiver marcado como **publicado**.
