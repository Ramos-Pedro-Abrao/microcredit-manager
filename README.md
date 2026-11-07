# Microcredit Manager

A backend foundation for managing clients, loans, installments, payments, users, and audit records. This phase sets up the API and data layer; it does not include a frontend or implemented authentication.

## Stack

- Node.js and TypeScript (strict mode)
- Express
- PostgreSQL with Prisma ORM
- Zod for environment validation
- JWT and bcryptjs dependencies reserved for a future authentication phase
- Vitest and Supertest
- Docker Compose for local PostgreSQL

## Run locally

Requirements: Node.js 20.19+ and Docker Compose.

1. From the repository root, copy `.env.example` to `.env`. Set a secure local `ADMIN_PASSWORD` before seeding. The example database credentials are for local development only.
2. Start PostgreSQL:

   ```sh
   docker compose up -d postgres
   ```

3. Install backend dependencies:

   ```sh
   cd backend
   npm install
   ```

4. Create and apply the database migration, then generate the Prisma client:

   ```sh
   npm run db:migrate
   npm run db:generate
   ```

5. Seed the initial administrator:

   ```sh
   npm run db:seed
   ```

   The seed reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the root `.env`. It updates the named administrator if that email already exists.

6. Start the development server:

   ```sh
   npm run dev
   ```

   The health endpoint is available at `http://localhost:3000/health`.

Useful commands from `backend/`:

```sh
npm test
npm run build
npm start
npm run prisma -- studio
```

## Folder structure

```text
backend/
  prisma/                 Prisma schema, migrations, and seed
  src/
    config/                Environment configuration
    middlewares/           Express error and 404 handlers
    modules/               clients, loans, installments, payments, users, audit
    utils/                 Shared HTTP utilities
    app.ts                 Express application
    server.ts              HTTP server entry point
  tests/                   Backend tests
docs/
  database.md               Database models and relationships
docker-compose.yml          Local PostgreSQL service
.env.example                Local environment template
```
