import { pool } from "../config/db.js";

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? AND is_active = TRUE LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
}

export async function listUsers() {
  const [rows] = await pool.execute(
    "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id DESC",
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

export async function createUser({ name, email, passwordHash, role }) {
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, role],
  );
  return result.insertId;
}

export async function updateUser({ id, name, role, isActive }) {
  await pool.execute(
    "UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?",
    [name, role, isActive, id],
  );
}

export async function updatePassword(id, passwordHash) {
  await pool.execute(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [passwordHash, id],
  );
}

export async function createAdmin({ name, email, passwordHash }) {
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
    [name, email, passwordHash],
  );
  return result.insertId;
}
