# Cupidora

A faith-oriented dating app that connects people based on shared values, religion, and preferences.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: NestJS (TypeScript strict mode)
- **Mobile**: Expo / React Native (TypeScript)
- **Database**: PostgreSQL 16 + PostGIS
- **Cache**: Redis 7
- **ORM**: TypeORM
- **Auth**: JWT (access + refresh tokens)

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
pnpm mobile
```

## API Endpoints

### Auth

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| POST   | `/auth/register`   | Register a new user      |
| POST   | `/auth/login`      | Log in                   |
| POST   | `/auth/refresh`    | Refresh access token     |

### Profiles (requires JWT)

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| POST   | `/profiles`           | Create your profile                      |
| GET    | `/profiles/me`        | Get your own profile                     |
| PATCH  | `/profiles/me`        | Update your profile                      |
| GET    | `/profiles/discover`  | Discover profiles matching preferences   |
| GET    | `/profiles/:id`       | View another user's public profile       |

## Stopping Infrastructure

```bash
pnpm docker:down
```
