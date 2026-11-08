import { pool } from "../config/db.js";

export async function listLoans() {
  const [rows] = await pool.execute(
    `SELECT loans.id, loans.client_id, clients.full_name AS client_name,
            loans.principal_amount, loans.interest_rate, loans.term_months,
            loans.frequency, loans.start_date, loans.status
     FROM loans
     INNER JOIN clients ON clients.id = loans.client_id
     ORDER BY loans.id DESC
     LIMIT 100`,
  );
  return rows;
}
