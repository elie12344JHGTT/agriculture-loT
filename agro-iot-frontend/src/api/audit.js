import api from "./axios";

let currentAuditUser = null;
let currentAuditSessionId = null;

export function setCurrentAuditUser(user) {
  currentAuditUser = user || null;
  currentAuditSessionId = user?.audit_session_id || null;
}

export async function logAudit({ page, action, details, status = "success" }) {
  try {
    await api.post("/api/audit-logs", {
      session_id: currentAuditSessionId,
      user_id: currentAuditUser?.id,
      user_name: currentAuditUser?.name || currentAuditUser?.nom,
      user_email: currentAuditUser?.email,
      user_role: currentAuditUser?.role,
      page,
      action,
      details,
      status
    });
  } catch (error) {
    console.error("Erreur journal audit :", error);
  }
}
