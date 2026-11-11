import { pool } from "../config/db.js";

export async function listClients({
  search = "",
  status = "",
  verificationStatus = "",
  page = 1,
  limit = 10,
}) {
  const pattern = `%${search}%`;
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM clients
     WHERE (? = '' OR status = ?)
       AND (? = '' OR verification_status = ?)
       AND (? = '' OR full_name LIKE ? OR document_number LIKE ? OR phone LIKE ?)`,
    [status, status, verificationStatus, verificationStatus, search, pattern, pattern, pattern],
  );
  const total = Number(countRows[0].total);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const [rows] = await pool.execute(
    `SELECT c.id, c.full_name, c.document_type, c.document_number, c.phone, c.address,
            c.occupation, c.monthly_income, c.status, c.email, c.verification_status,
            c.verified_by, c.verified_at, c.rejection_reason, c.registered_via,
            c.created_at, c.updated_at
     FROM clients c
     WHERE (? = '' OR status = ?)
       AND (? = '' OR verification_status = ?)
       AND (? = '' OR full_name LIKE ? OR document_number LIKE ? OR phone LIKE ?)
     ORDER BY c.id DESC
     LIMIT ? OFFSET ?`,
    [
      status,
      status,
      verificationStatus,
      verificationStatus,
      search,
      pattern,
      pattern,
      pattern,
      limit,
      (currentPage - 1) * limit,
    ],
  );
  return { clients: rows, total, page: currentPage, totalPages };
}

export async function countPendingVerifications() {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM clients WHERE verification_status = 'PENDING'",
  );
  return Number(rows[0].total);
}

export async function findClientById(id) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.full_name, c.document_type, c.document_number, c.phone, c.address,
            c.email, c.occupation, c.monthly_income, c.status, c.verification_status,
            c.verified_by, u.name AS verified_by_name, c.verified_at, c.rejection_reason,
            c.registered_via, c.created_at, c.updated_at
     FROM clients c LEFT JOIN users u ON u.id = c.verified_by
     WHERE c.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createClient(client) {
  const [result] = await pool.execute(
    `INSERT INTO clients
      (full_name, email, document_type, document_number, phone, address, occupation,
       monthly_income, status, verification_status, registered_via)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'VERIFIED', 'STAFF')`,
    [
      client.full_name,
      client.email || null,
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

export async function findClientByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, full_name, email, document_type, document_number,
            phone, address, occupation, monthly_income, status,
            verification_status, verified_by, verified_at, rejection_reason,
            registered_via, created_at, updated_at
     FROM clients WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function updateOwnClientProfile(userId, { phone, address, occupation, monthly_income }) {
  const [result] = await pool.execute(
    `UPDATE clients SET phone = ?, address = ?, occupation = ?, monthly_income = ?
     WHERE user_id = ?`,
    [phone || null, address || null, occupation || null, monthly_income || null, userId],
  );
  return result.affectedRows;
}

export async function updateClientVerification(id, reviewerId, status, reason = null) {
  const [result] = await pool.execute(
    `UPDATE clients
     SET verification_status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP,
         rejection_reason = ?
     WHERE id = ? AND verification_status = 'PENDING'`,
    [status, reviewerId, reason, id],
  );
  return result.affectedRows;
}

export async function updateClient(client) {
  await pool.execute(
    `UPDATE clients
     SET full_name = ?, email = ?, document_type = ?, document_number = ?, phone = ?,
         address = ?, occupation = ?, monthly_income = ?, status = ?
     WHERE id = ?`,
    [
      client.full_name,
      client.email || null,
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
