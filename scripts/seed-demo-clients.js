import { env } from "../src/config/env.js";

if (env.NODE_ENV === "production") {
  throw new Error("Demo clients can only be seeded outside production.");
}

const { pool } = await import("../src/config/db.js");

const clients = [
  ["Ana Manuel", "DEMO", "DEMO-CLIENT-001", "+244900000001", "Luanda", "Teacher", "185000.00"],
  ["Bento Paulo", "DEMO", "DEMO-CLIENT-002", "+244900000002", "Viana", "Shopkeeper", "240000.00"],
  ["Carla Domingos", "DEMO", "DEMO-CLIENT-003", "+244900000003", "Belas", "Tailor", "97500.00"],
  ["Daniel Mateus", "DEMO", "DEMO-CLIENT-004", "+244900000004", "Cazenga", "Driver", "160000.00"],
  ["Ema Joaquim", "DEMO", "DEMO-CLIENT-005", "+244900000005", "Kilamba", "Nurse", "310000.00"],
  ["Filipe Alberto", "DEMO", "DEMO-CLIENT-006", "+244900000006", "Samba", "Mechanic", "225000.00"],
  ["Graça Miguel", "DEMO", "DEMO-CLIENT-007", "+244900000007", "Maianga", "Baker", "125000.00"],
  ["Hugo Francisco", "DEMO", "DEMO-CLIENT-008", "+244900000008", "Talatona", "Accountant", "420000.00"],
  ["Isabel António", "DEMO", "DEMO-CLIENT-009", "+244900000009", "Rangel", "Market vendor", "118000.00"],
  ["José Bernardo", "DEMO", "DEMO-CLIENT-010", "+244900000010", "Ingombota", "Electrician", "205000.00"],
  ["Lina Sebastião", "DEMO", "DEMO-CLIENT-011", "+244900000011", "Cacuaco", "Hairdresser", "132000.00"],
  ["Manuel Afonso", "DEMO", "DEMO-CLIENT-012", "+244900000012", "Morro Bento", "Security guard", "150000.00"],
  ["Nádia António", "DEMO", "DEMO-CLIENT-013", "+244900000013", "Sambizanga", "Cook", "110500.00"],
  ["Óscar Luís", "DEMO", "DEMO-CLIENT-014", "+244900000014", "Benfica", "Construction worker", "198000.00"],
  ["Paula Domingos", "DEMO", "DEMO-CLIENT-015", "+244900000015", "Camama", "Pharmacist", "385000.00"],
  ["Quim Manuel", "DEMO", "DEMO-CLIENT-016", "+244900000016", "Zango", "Welder", "178000.00"],
  ["Rosa Joaquim", "DEMO", "DEMO-CLIENT-017", "+244900000017", "Futungo", "Seamstress", "123000.00"],
  ["Sérgio Mateus", "DEMO", "DEMO-CLIENT-018", "+244900000018", "Patriota", "Plumber", "215000.00"],
  ["Teresa Alberto", "DEMO", "DEMO-CLIENT-019", "+244900000019", "Mulembeira", "Retail assistant", "142000.00"],
  ["Umar Francisco", "DEMO", "DEMO-CLIENT-020", "+244900000020", "Calemba", "Farmer", "165000.00"],
  ["Vera Miguel", "DEMO", "DEMO-CLIENT-021", "+244900000021", "Golfe", "Designer", "275000.00"],
  ["Walter Bernardo", "DEMO", "DEMO-CLIENT-022", "+244900000022", "São Paulo", "Courier", "156000.00"],
  ["Xana Sebastião", "DEMO", "DEMO-CLIENT-023", "+244900000023", "Quifica", "Florist", "99000.00"],
  ["Yuri Afonso", "DEMO", "DEMO-CLIENT-024", "+244900000024", "Camama", "Technician", "235000.00"],
  ["Zita Luís", "DEMO", "DEMO-CLIENT-025", "+244900000025", "Viana", "Accountant", "295000.00"],
];

try {
  let inserted = 0;
  for (const client of clients) {
    const [result] = await pool.execute(
      `INSERT IGNORE INTO clients
        (full_name, document_type, document_number, phone, address, occupation, monthly_income)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      client,
    );
    inserted += result.affectedRows;
  }
  console.info(`Demo client seed complete: ${inserted} inserted, ${clients.length - inserted} already present.`);
} finally {
  await pool.end();
}
