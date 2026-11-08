# Microcredit Manager

A server-rendered loan and microcredit management application built with Node.js, Express, Handlebars, and MariaDB/MySQL. It uses plain SQL through `mysql2`; the login page is currently a placeholder.

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

4. Create the initial administrator and start the development server:

   ```sh
   npm run db:seed
   npm run dev
   ```

The application is available at `http://localhost:3000/`; `http://localhost:3000/health` checks the database connection.

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
