import { listLoans } from "../models/loans.js";

export async function index(_req, res) {
  const loans = await listLoans();
  res.render("pages/records", { title: "Loans", records: loans });
}
