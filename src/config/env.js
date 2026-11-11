import dotenv from "dotenv";

dotenv.config();

const databaseVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_NAME",
];
const hasDatabaseConfiguration = databaseVariables.some((name) => process.env[name] !== undefined);
const databaseDefaults = hasDatabaseConfiguration
  ? {}
  : {
      DB_HOST: "localhost",
      DB_PORT: "3306",
      DB_USER: "root",
      DB_NAME: "microcredit",
    };

if (!hasDatabaseConfiguration) {
  console.warn(
    "DB_* settings are absent; using local XAMPP defaults (localhost:3306, root, microcredit). DATABASE_URL is not used.",
  );
}

const requiredVariables = [
  ...databaseVariables,
  "SESSION_SECRET",
];
const missingVariables = requiredVariables.filter((name) => {
  const value = process.env[name] ?? databaseDefaults[name];
  return typeof value !== "string" || value.trim() === "";
});

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`);
}

const port = Number(process.env.PORT ?? 3000);
const databasePort = Number(process.env.DB_PORT ?? databaseDefaults.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
if (!Number.isInteger(databasePort) || databasePort < 1 || databasePort > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

export const env = Object.freeze({
  APP_NAME: process.env.APP_NAME?.trim() || "Microcrédito",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL?.trim() || "apoio@microcredito.ao",
  SUPPORT_PHONE: process.env.SUPPORT_PHONE?.trim() || "+244 900 000 000",
  PORT: port,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DB_HOST: process.env.DB_HOST ?? databaseDefaults.DB_HOST,
  DB_PORT: databasePort,
  DB_USER: process.env.DB_USER ?? databaseDefaults.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ?? "",
  DB_NAME: process.env.DB_NAME ?? databaseDefaults.DB_NAME,
  SESSION_SECRET: process.env.SESSION_SECRET,
});
