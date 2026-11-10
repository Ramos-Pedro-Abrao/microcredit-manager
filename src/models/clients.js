import { pool } from "../config/db.js";

export async function listClients({ search = "", status = "", page = 1, limit = 10 }) {
  const pattern = `%${search}%`;
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM clients
     WHERE (? = '' OR status = ?)
       AND (? = '' OR full_name LIKE ? OR document_number LIKE ? OR phone LIKE ?)`,
    [status, status, search, pattern, pattern, pattern],
  );
  const total = Number(countRows[0].total);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const [rows] = await pool.execute(
    `SELECT id, full_name, document_type, document_number, phone, address,
            occupation, monthly_income, status, created_at, updated_at
     FROM clients
     WHERE (? = '' OR status = ?)
       AND (? = '' OR full_name LIKE ? OR document_number LIKE ? OR phone LIKE ?)
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [status, status, search, pattern, pattern, pattern, limit, (currentPage - 1) * limit],
  );
  return { clients: rows, total, page: currentPage, totalPages };
}

export async function findClientById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, document_type, document_number, phone, address,
            occupation, monthly_income, status, created_at, updated_at
     FROM clients WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createClient(client) {
  const [result] = await pool.execute(
    `INSERT INTO clients
      (full_name, document_type, document_number, phone, address, occupation, monthly_income)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      client.full_name,
      client.document_type,
      client.document_number,
      client.phone,
      client.address,
      client.occupation,
      client.monthly_income,
    ],
  );
  return result.insertId;
}

export async function updateClient(client) {
  await pool.execute(
    `UPDATE clients
     SET full_name = ?, document_type = ?, document_number = ?, phone = ?,
         address = ?, occupation = ?, monthly_income = ?, status = ?
     WHERE id = ?`,
    [
      client.full_name,
      client.document_type,
      client.document_number,
      client.phone,
      client.address,
      client.occupation,
      client.monthly_income,
      client.status,
      client.id,
    ],
  );
}
