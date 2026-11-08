import { pool } from "../config/db.js";

export async function listPayments() {
  const [rows] = await pool.execute(
    `SELECT payments.id, payments.loan_id, payments.installment_id,
            payments.amount, payments.method, payments.paid_at,
            payments.reversed_at, users.name AS received_by
     FROM payments
     INNER JOIN users ON users.id = payments.received_by
     ORDER BY payments.paid_at DESC
     LIMIT 100`,
  );
  return rows;
}
