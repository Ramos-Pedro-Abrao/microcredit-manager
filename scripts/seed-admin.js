import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { pool } from "../src/config/db.js";

const requiredVariables = ["SEED_ADMIN_NAME", "SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD"];
const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`);
}

const name = process.env.SEED_ADMIN_NAME.trim();
const email = process.env.SEED_ADMIN_EMAIL.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;

try {
  const [existingUsers] = await pool.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  );

  if (existingUsers.length > 0) {
    console.info(`Administrator ${email} already exists; no user was added.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
      [name, email, passwordHash],
    );
    console.info(`Administrator ${email} was created.`);
  }
} finally {
  await pool.end();
}
