import { insertAuditLog } from "../models/audit-logs.js";

export async function log({ userId, action, entity, entityId, details }) {
  await insertAuditLog({ userId, action, entity, entityId, details });
}
