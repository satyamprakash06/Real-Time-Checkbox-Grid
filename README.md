# Real-Time Checkbox Grid

A shared, multiplayer checkbox grid. Click a box and everyone else connected sees it flip instantly — synced across clients (and across server instances) via Redis pub/sub.

The checkboxes themselves aren't the point. This is a small demo of keeping shared, mutable state consistent in real time across multiple concurrent clients — and multiple server processes — without a heavyweight message queue.

## How it works

- **Express** serves the static frontend and a `GET /checkboxes` endpoint that returns current state.
- **Socket.io** pushes state changes to all connected clients over WebSockets.
- **Redis** is the single source of truth for checkbox state (`GET`/`SET` on a JSON blob) and doubles as the fan-out mechanism via `PUBLISH`/`SUBSCRIBE`, so any number of Node server instances can stay in sync — not just clients on the same process.

```
client click
   -> socket.emit('client:checkbox:change')
   -> server updates Redis state
   -> server publishes to Redis channel
   -> every subscribed server instance receives it
   -> each instance broadcasts to its own connected sockets
   -> all clients update in real time
```

This pub/sub layer is what lets the app scale horizontally — add more Node instances behind a load balancer and they all stay consistent through Redis, with no direct coordination between them.

## Tech stack

- Node.js + Express
- Socket.io
- Redis (via `ioredis`)
- Vanilla JS / HTML / CSS on the frontend (no build step)

## Getting started

### Prerequisites
- Node.js 18+
- Redis running locally (or update the host/port in `redis-connection.js`)

### Install & run

```bash
npm install
npm start
```

The app serves on `http://localhost:8000` by default (override with the `PORT` env var).

Make sure Redis is running first:

```bash
redis-server
```

## Project structure

```
.
├── index.js               # Express + Socket.io server
├── redis-connection.js    # Redis client setup (redis, publisher, subscriber)
├── public/
│   └── index.html          # Frontend: renders checkboxes, listens for socket events
└── README.md
```

## Notable design decisions

- **Redis as both store and message bus** — one dependency instead of a separate cache + separate broker.
- **Per-connection rate limiting** — each socket is limited to one state change roughly every 5.5 seconds, tracked in Redis so it also works across multiple server instances.

## Known limitations

- Rate limiting is keyed on the Socket.io connection ID, which is reissued on reconnect/refresh — it discourages accidental spam but isn't a hard abuse control.
- No authentication; state is fully public and writable by anyone with the page open.
- Checkbox count is currently fixed at startup (see `CHECKBOX_SIZE` in `index.js`) rather than dynamically configurable.

## License

MIT
