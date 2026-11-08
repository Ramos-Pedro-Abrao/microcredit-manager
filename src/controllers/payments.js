import { listPayments } from "../models/payments.js";

export async function index(_req, res) {
  const payments = await listPayments();
  res.render("pages/records", { title: "Payments", records: payments });
}
