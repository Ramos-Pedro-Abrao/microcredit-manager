# Microcredit Manager

A server-rendered loan and microcredit management application built with Node.js, Express, Handlebars, and MariaDB/MySQL. It uses plain SQL through `mysql2`.

## Features so far

- Session-based sign-in with bcrypt password verification, CSRF protection, and role-based access.
- Admin user management, including account deactivation and password resets.
- Public client registration with pending staff verification.
- Client self-service profile management and loan request submission/cancellation.
- Staff client management, verification, searchable/filterable paginated lists, and review of loan requests.
- Append-only audit records for sign-in, user management, client verification, and loan request decisions.
- Request approval records only; loan, installment, and contract creation are planned for Phase 4.

## Run locally with XAMPP on Linux

1. Start MySQL:

   ```sh
   sudo /opt/lampp/lampp startmysql
   ```

2. For a fresh install, import the schema with phpMyAdmin or the XAMPP MySQL client:

   ```sh
   /opt/lampp/bin/mysql -u root < database/schema.sql
   ```

   For an existing Phase 2 database, apply the additive migration once (it preserves existing client records and marks them as STAFF-registered and VERIFIED):

   ```sh
   /opt/lampp/bin/mysql -u root microcredit < database/migrations/002_client_portal.sql
   ```

3. Configure the environment and install dependencies:

   ```sh
   cp -n .env.example .env
   npm install
   ```

   Edit `.env` and set a private `SESSION_SECRET` and `SEED_ADMIN_PASSWORD`. If `DB_*` settings are omitted, the app uses local XAMPP defaults (`localhost:3306`, `root`, empty password, database `microcredit`). A PostgreSQL `DATABASE_URL` is not used.

4. Create the initial administrator and start the development server:

   ```sh
   npm run db:seed
   npm run dev
   ```

Clients register at `/register`, then wait for staff verification. Verified clients can submit one pending loan request at a time; ADMIN and MANAGER users can review requests. Approval does not yet create a loan. Staff can also create walk-in client records. The application is available at `http://localhost:3000/`; `http://localhost:3000/health` checks the database connection.

## Roles and permissions

| Action | ADMIN | MANAGER | OPERATOR | CLIENT |
| --- | --- | --- | --- |
| View, create, and edit staff client records | Yes | Yes | Yes | No |
| Verify or reject client registrations | Yes | Yes | No | No |
| Change client status | Yes | Yes | No | No |
| Manage users, reset passwords, and deactivate accounts | Yes | No | No | No |
| View and edit own contact profile | No | No | No | Yes |
| Submit/cancel own loan requests | No | No | No | Yes |
| Review loan requests | Yes | Yes | No | No |
| Access staff dashboard and queues | Yes | Yes | Yes | No |

Users are deactivated rather than deleted. An admin cannot deactivate or demote their own account.

## Available npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with nodemon |
| `npm start` | Start the server |
| `npm run db:seed` | Create the initial admin account if it does not exist |

## Structure

```text
database/schema.sql       Database schema
scripts/seed-admin.js     Initial administrator seed
src/
  config/                 Environment and MySQL pool
  controllers/            Request handlers
  middlewares/            Authentication guard, errors, flash messages
  models/                 Parameterized SQL queries
  routes/                 Home, authentication, clients, loans, payments
  utils/                  Shared helpers
  app.js                  Express and Handlebars setup
  server.js               HTTP server entry point
views/
  layouts/                Shared page layout
  pages/                  Home, login, error, and not-found pages
  partials/               Header, footer, and flash messages
public/                   Application CSS, JavaScript, and images
```
