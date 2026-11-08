import { pool } from "../config/db.js";

export async function listRecentAuditLogs() {
  const [rows] = await pool.execute(
    `SELECT id, user_id, action, entity, entity_id, details, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT 100`,
  );
  return rows;
}
