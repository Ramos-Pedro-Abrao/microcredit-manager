import { pool } from "../config/db.js";

export function home(_req, res) {
  res.render("pages/home", {
    title: "Microcredit Manager",
  });
}

export function login(_req, res) {
  res.render("pages/login", {
    title: "Sign in | Microcredit Manager",
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
