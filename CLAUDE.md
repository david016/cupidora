# Cupidora — Dating App

## Tech Stack

- Monorepo managed with pnpm workspaces
- Backend: NestJS (apps/api) — TypeScript strict mode
- Mobile: Expo / React Native (apps/mobile) — TypeScript
- Database: PostgreSQL 16 with PostGIS extension
- Cache: Redis 7
- ORM: TypeORM
- Auth: JWT (access + refresh tokens)
- Real-time: Socket.io via NestJS WebSocket gateway
- Containerization: Docker Compose for local dev

## Project Structure

apps/
api/ — NestJS backend
mobile/ — Expo React Native app
packages/
shared/ — shared types, constants, validation schemas
docker/ — Dockerfiles if needed
docker-compose.yml — Postgres, Redis, API

## Conventions

- Use TypeORM with repository pattern (inject repos into services)
- Entities: src/{module}/entities/{name}.entity.ts
- DTOs: src/{module}/dto/{name}.dto.ts
- All REST responses use shape: { data: T, meta?: object }
- Use class-validator + class-transformer for DTO validation
- Use UUIDs for all primary keys
- Naming: camelCase in code, snake_case in database columns
- Environment variables via @nestjs/config, always use .env.example
- Do not add Swagger/OpenAPI unless asked
- Do not add unit tests unless asked
- Keep modules focused and independent
- Use pnpm, never npm or yarn

## Database Notes

- PostgreSQL with PostGIS for location queries
- Store user location as geography(Point, 4326)
- Use ST_DWithin for distance-based discovery queries
- JSONB for flexible fields (photo URLs, prompts, preferences)

## Key Business Rules

- When a user likes someone, the liked user sees it immediately
- Unmatched users can send ONE message per day to any user
- A match is created automatically when both users have liked each other
- Matched users can message freely with no limits
