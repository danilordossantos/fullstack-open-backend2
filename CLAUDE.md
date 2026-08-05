# fullstack-open-backend2

Projeto backend do Full Stack Open (FSO) — blog list API.

## Stack
- Node.js v20 + Express 5 (async error handling automático)
- MongoDB Atlas + Mongoose 9
- JWT (jsonwebtoken) + bcrypt para autenticação
- Lodash para helpers de array

## Estrutura

```
index.js          # sobe o servidor (app.listen)
app.js            # configura Express, middlewares, rotas
controllers/
  blogs.js        # CRUD de blogs
  users.js        # criação e listagem de usuários
  login.js        # autenticação JWT
models/
  blog.js         # schema: title, author, url, likes, user (ref)
  user.js         # schema: username, name, passwordHash, blogs[]
utils/
  config.js       # PORT e MONGODB_URI via dotenv
  logger.js       # info/error (silenciados em NODE_ENV=test)
  middleware.js   # tokenExtractor, userExtractor, errorHandler
tests/
  blog_api.test.js
  user_api.test.js
  list_helper.test.js
  test_helper.js
```

## Convenções
- CommonJS (require/module.exports) — não ES modules
- Express 5: sem try/catch nas rotas, erros async vão pro errorHandler automaticamente
- Mongoose: usar `returnDocument: 'after'` em vez de `{ new: true }`
- node:test + assert (migrado do Jest)
- cross-env para scripts npm (compatibilidade WSL)

## Autenticação
- Token JWT com expiração de 1h (`expiresIn: 60 * 60`)
- tokenExtractor: extrai token do header Authorization Bearer
- userExtractor: decodifica token e busca User no banco, coloca em request.user
- userExtractor aplicado só em /api/blogs (não em /api/users e /api/login)

## Banco de dados
- Desenvolvimento: banco `blog` no Atlas
- Testes: banco `testBlog` no Atlas (NODE_ENV=test)
- Variáveis: MONGODB_URI e TEST_MONGODB_URI no .env

## Testes
- Framework: node:test + assert (não Jest)
- Rodar todos: `npm test`
- Rodar arquivo específico: `npm test -- tests/blog_api.test.js`
- Concorrência sequencial: `--test-concurrency=1`
- beforeEach: limpa banco, cria usuário root, faz login, cria blogs via POST com token

## Erros tratados no errorHandler
- CastError → 400
- ValidationError → 400
- MongoServerError E11000 → 400 (username duplicado)
- JsonWebTokenError → 401
- TokenExpiredError → 401

## Padrões de commit
- feat: nova funcionalidade
- refactor: refatoração sem mudança de comportamento
- fix: correção de bug