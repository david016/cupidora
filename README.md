# Cupidora

A dating app that connects people based on shared values, religion, and preferences.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: NestJS (TypeScript strict mode)
- **Mobile**: Expo / React Native (TypeScript)
- **Database**: PostgreSQL 16 + PostGIS
- **Cache**: Redis 7
- **ORM**: TypeORM
- **Auth**: JWT (access + refresh tokens)
- **Real-time**: Socket.io via NestJS WebSocket gateway

## Project Structure

```
apps/
  api/          — NestJS backend
  mobile/       — Expo React Native app
packages/
  shared/       — shared types, constants, validation schemas
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)
- [Docker](https://www.docker.com/) & Docker Compose

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and update the JWT secrets for production use.

### 3. Start infrastructure (PostgreSQL + Redis)

```bash
pnpm docker:up
```

This starts:

- **PostgreSQL** (with PostGIS) on `localhost:5432`
- **Redis** on `localhost:6379`

### 4. Run the API

```bash
pnpm api
```

The API starts on `http://localhost:3000`. The database schema is auto-synchronized in development mode.

### 5. Run the mobile app

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env` to set the API URL. Defaults to `http://10.0.2.2:3000` (Android emulator). For a physical device, use your machine's LAN IP (e.g. `http://192.168.0.100:3000`).

```bash
pnpm mobile
```

## API Endpoints

### Auth

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| POST   | `/auth/register` | Register a new user  |
| POST   | `/auth/login`    | Log in               |
| POST   | `/auth/refresh`  | Refresh access token |

### Profiles (requires JWT)

| Method | Endpoint             | Description                            |
| ------ | -------------------- | -------------------------------------- |
| POST   | `/profiles`          | Create your profile                    |
| GET    | `/profiles/me`       | Get your own profile                   |
| PATCH  | `/profiles/me`       | Update your profile                    |
| GET    | `/profiles/discover` | Discover profiles matching preferences |
| GET    | `/profiles/:id`      | View another user's public profile     |

### Likes (requires JWT)

| Method | Endpoint          | Description                                      |
| ------ | ----------------- | ------------------------------------------------ |
| POST   | `/likes/:userId`  | Like a user (auto-creates match if mutual)       |
| GET    | `/likes/received` | List users who liked you, with profile info       |
| GET    | `/likes/sent`     | List users you've liked, with profile info        |
| DELETE | `/likes/:userId`  | Unlike a user (also removes match if one existed) |

### Matches (requires JWT)

| Method | Endpoint             | Description                          |
| ------ | -------------------- | ------------------------------------ |
| GET    | `/matches`           | List your matches with profile info  |
| DELETE | `/matches/:matchId`  | Unmatch (also removes both likes)    |

### Messages (requires JWT)

| Method | Endpoint                        | Description                                          |
| ------ | ------------------------------- | ---------------------------------------------------- |
| POST   | `/messages`                     | Send a message (matched: unlimited, unmatched: 1/day)|
| GET    | `/messages/conversations`       | List all conversations with last message              |
| GET    | `/messages/conversation/:userId`| Get paginated message history with a user             |
| PATCH  | `/messages/:messageId/read`     | Mark a message as read (recipient only)               |

### WebSocket Events

Connect to the WebSocket server with a JWT token (query param `token`, auth object, or `Authorization` header).

| Event         | Direction      | Description                          |
| ------------- | -------------- | ------------------------------------ |
| `newMessage`  | server → client| Emitted to recipient when a message is sent |
| `messageRead` | server → client| Emitted to sender when their message is read |

## Stopping Infrastructure

```bash
pnpm docker:down
```
