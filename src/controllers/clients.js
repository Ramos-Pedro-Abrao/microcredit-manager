import { listClients } from "../models/clients.js";

export async function index(_req, res) {
  const clients = await listClients();
  res.render("pages/records", { title: "Clients", records: clients });
}
