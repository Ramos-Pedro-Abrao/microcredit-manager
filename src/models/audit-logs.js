import { pool } from "../config/db.js";

export async function insertAuditLog({ userId, action, entity, entityId, details }) {
  await pool.execute(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
     VALUES (?, ?, ?, ?, ?)`,
    [userId ?? null, action, entity, String(entityId), JSON.stringify(details ?? {})],
  );
}

export async function listRecentAuditLogs() {
  const [rows] = await pool.execute(
    `SELECT id, user_id, action, entity, entity_id, details, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT 100`,
  );
  return rows;
}
