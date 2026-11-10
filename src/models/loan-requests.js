import { pool } from "../config/db.js";

export async function listForClient(clientId) {
  const [rows] = await pool.execute(
    `SELECT id, amount, term_months, frequency, purpose, status, created_at,
            review_notes, approved_amount, approved_interest_rate
     FROM loan_requests WHERE client_id = ? ORDER BY created_at DESC`,
    [clientId],
  );
  return rows;
}

export async function findPendingForClient(clientId) {
  const [rows] = await pool.execute(
    `SELECT id FROM loan_requests
     WHERE client_id = ? AND status = 'PENDING' LIMIT 1`,
    [clientId],
  );
  return rows[0] ?? null;
}

export async function createLoanRequest(clientId, request) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM clients WHERE id = ? FOR UPDATE", [clientId]);
    const [pending] = await connection.execute(
      "SELECT id FROM loan_requests WHERE client_id = ? AND status = 'PENDING' LIMIT 1",
      [clientId],
    );
    if (pending.length) {
      const error = new Error("A pending request already exists.");
      error.code = "PENDING_REQUEST_EXISTS";
      throw error;
    }
    const [result] = await connection.execute(
      `INSERT INTO loan_requests (client_id, amount, term_months, frequency, purpose)
       VALUES (?, ?, ?, ?, ?)`,
      [clientId, request.amount, request.term_months, request.frequency, request.purpose],
    );
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function cancelForClient(requestId, clientId) {
  const [result] = await pool.execute(
    `UPDATE loan_requests SET status = 'CANCELLED'
     WHERE id = ? AND client_id = ? AND status = 'PENDING'`,
    [requestId, clientId],
  );
  return result.affectedRows;
}

export async function listLoanRequests({ status = "", page = 1, limit = 10 }) {
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM loan_requests WHERE (? = '' OR status = ?)`,
    [status, status],
  );
  const total = Number(countRows[0].total);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const [rows] = await pool.execute(
    `SELECT lr.id, lr.client_id, lr.amount, lr.term_months, lr.frequency,
            lr.purpose, lr.status, lr.created_at, c.full_name, c.verification_status
     FROM loan_requests lr
     JOIN clients c ON c.id = lr.client_id
     WHERE (? = '' OR lr.status = ?)
     ORDER BY lr.created_at DESC
     LIMIT ? OFFSET ?`,
    [status, status, limit, (currentPage - 1) * limit],
  );
  return { requests: rows, total, page: currentPage, totalPages };
}

export async function countPendingLoanRequests() {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM loan_requests WHERE status = 'PENDING'",
  );
  return Number(rows[0].total);
}

export async function findLoanRequestById(id) {
  const [rows] = await pool.execute(
    `SELECT lr.id, lr.client_id, lr.amount, lr.term_months, lr.frequency,
            lr.purpose, lr.status, lr.reviewed_by, lr.reviewed_at,
            lr.review_notes, lr.approved_interest_rate, lr.approved_amount,
            lr.created_at, lr.updated_at, c.full_name, c.document_number,
            c.verification_status
     FROM loan_requests lr
     JOIN clients c ON c.id = lr.client_id
     WHERE lr.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function reviewLoanRequest(id, reviewerId, decision) {
  if (decision.status === "APPROVED") {
    const [result] = await pool.execute(
      `UPDATE loan_requests lr
       JOIN clients c ON c.id = lr.client_id
       SET lr.status = 'APPROVED', lr.reviewed_by = ?, lr.reviewed_at = CURRENT_TIMESTAMP,
           lr.review_notes = ?, lr.approved_amount = ?, lr.approved_interest_rate = ?
       WHERE lr.id = ? AND lr.status = 'PENDING'
         AND c.verification_status = 'VERIFIED'`,
      [
        reviewerId,
        decision.review_notes || null,
        decision.approved_amount,
        decision.approved_interest_rate,
        id,
      ],
    );
    return result.affectedRows;
  }
  const [result] = await pool.execute(
    `UPDATE loan_requests lr
     JOIN clients c ON c.id = lr.client_id
     SET lr.status = 'REJECTED', lr.reviewed_by = ?, lr.reviewed_at = CURRENT_TIMESTAMP,
         lr.review_notes = ?
     WHERE lr.id = ? AND lr.status = 'PENDING'
       AND c.verification_status = 'VERIFIED'`,
    [reviewerId, decision.review_notes, id],
  );
  return result.affectedRows;
}
