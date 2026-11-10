# Microcredit Manager

A server-rendered loan and microcredit management application built with Node.js, Express, Handlebars, and MariaDB/MySQL. It uses plain SQL through `mysql2`.

## Features so far

- Session-based sign-in with bcrypt password verification, CSRF protection, and role-based access.
- Admin user management, including account deactivation and password resets.
- Client creation, editing, search, status filtering, and paginated listing.
- Append-only audit records for sign-in and user/client changes.
- Loan and payment schema and protected placeholder pages; loan workflows are planned for Phase 3.

## Run locally with XAMPP on Linux

1. Start MySQL:

   ```sh
   sudo /opt/lampp/lampp startmysql
   ```

2. Import the schema with phpMyAdmin or the XAMPP MySQL client:

   ```sh
   /opt/lampp/bin/mysql -u root < database/schema.sql
   ```

3. Configure the environment and install dependencies:

   ```sh
   cp -n .env.example .env
   npm install
   ```

   Edit `.env` and set a private `SESSION_SECRET` and `SEED_ADMIN_PASSWORD`. If `DB_*` settings are omitted, the app uses local XAMPP defaults (`localhost:3306`, `root`, empty password, database `microcredit`). A PostgreSQL `DATABASE_URL` is not used.

4. Create the initial administrator and optionally add development-only sample clients:

   ```sh
   npm run db:seed
   npm run db:seed:demo
   npm run dev
   ```

`db:seed:demo` inserts 25 fake clients, skips existing document numbers, and refuses to run when `NODE_ENV=production`. The application is available at `http://localhost:3000/`; `http://localhost:3000/health` checks the database connection.

## Roles and permissions

| Action | ADMIN | MANAGER | OPERATOR |
| --- | --- | --- | --- |
| View, create, and edit clients | Yes | Yes | Yes |
| Change client status | Yes | Yes | No |
| View/manage users, reset passwords, and deactivate accounts | Yes | No | No |
| Access the dashboard and protected application pages | Yes | Yes | Yes |

Users are deactivated rather than deleted. An admin cannot deactivate or demote their own account.

## Available npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with nodemon |
| `npm start` | Start the server |
| `npm run db:seed` | Create the initial admin account if it does not exist |
| `npm run db:seed:demo` | Add repeatable fake client data outside production |

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
