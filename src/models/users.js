import { pool } from "../config/db.js";

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
}

export async function createAdmin({ name, email, passwordHash }) {
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
    [name, email, passwordHash],
  );
  return result.insertId;
}
