import { pool } from "../config/db.js";

export async function listInstallmentsByLoan(loanId) {
  const [rows] = await pool.execute(
    `SELECT id, loan_id, number, due_date, principal_part, interest_part,
            total_amount, paid_amount, status
     FROM installments
     WHERE loan_id = ?
     ORDER BY number`,
    [loanId],
  );
  return rows;
}
