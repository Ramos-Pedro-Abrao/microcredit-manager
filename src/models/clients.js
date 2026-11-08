import { pool } from "../config/db.js";

export async function listClients() {
  const [rows] = await pool.execute(
    "SELECT id, full_name, document_type, document_number, phone, status, created_at FROM clients ORDER BY id DESC LIMIT 100",
  );
  return rows;
}
