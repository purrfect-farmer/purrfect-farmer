# Routes

Loaded by `@fastify/autoload` (see `app.js`). Folder names become URL prefixes, file names do not.

```
routes/
  root.js                 GET /
  api/                    /api, member routes (Telegram init data)
    server.js             GET /server
    account.js            /subscription, /session, /sync
    farmers.js            /farmers/*
    auto.js               /auto/:drop/*
    telegram/index.js     /api/telegram/*
    manager/              /api/manager, admin routes (JWT required)
      auth.js             /login, /user, /update-password
      server.js           backups, whiskers import, proxies, server update
      farmers.js          /farmers/*
      members.js          /members/*
      env.js              /env/*
```

## Rules

- One file per resource. Each file default-exports `async function (fastify) {}`.
- No `index.js` in a folder that holds several files: autoload loads only `index.js` when it exists and skips its siblings.
- Every file in a folder shares the folder's prefix, so splitting a file never changes URLs.
- Every `/api/manager/*` route gets the JWT check from an `onRoute` hook in `plugins/authentication.js`, however it is loaded. A route that must stay open sets `config: { public: true }`.
- Member routes add their own `preHandler` (`fastify.validateWebAppData`, `fastify.verifySubscription`) because some are public.
- Shared request schemas live in `schemas/`, helpers in `lib/`. Any `.js` placed here is loaded as a route plugin.
