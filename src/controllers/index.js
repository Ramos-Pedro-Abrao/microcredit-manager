import { pool } from "../config/db.js";
import { countPendingVerifications } from "../models/clients.js";
import { countPendingLoanRequests } from "../models/loan-requests.js";

export function home(req, res) {
  if (req.session.user) {
    return res.redirect(req.session.user.role === "CLIENT" ? "/portal" : "/dashboard");
  }
  res.render("pages/home", {
    title: "Microcredit Manager",
  });
}

export async function dashboard(req, res) {
  const [pendingVerifications, pendingRequests] = await Promise.all([
    countPendingVerifications(),
    countPendingLoanRequests(),
  ]);
  res.render("pages/dashboard", {
    title: "Dashboard | Microcredit Manager",
    pendingVerifications,
    pendingRequests,
  });
}

export async function health(_req, res) {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check database query failed:", error);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
}
