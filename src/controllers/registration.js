import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { log } from "../utils/audit.js";
import {
  email as isEmail,
  minLength,
  numberAtLeastZero,
  required,
} from "../utils/validators.js";

function registrationValues(body = {}) {
  return {
    full_name: typeof body.full_name === "string" ? body.full_name.trim() : "",
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    document_type: typeof body.document_type === "string" ? body.document_type.trim() : "",
    document_number: typeof body.document_number === "string" ? body.document_number.trim() : "",
    address: typeof body.address === "string" ? body.address.trim() : "",
    occupation: typeof body.occupation === "string" ? body.occupation.trim() : "",
    monthly_income: typeof body.monthly_income === "string" ? body.monthly_income.trim() : "",
  };
}

function registrationErrors(values, password, confirmation) {
  const errors = [];
  if (!required(values.full_name) || values.full_name.length > 180) {
    errors.push("Full name is required and must be 180 characters or fewer.");
  }
  if (!isEmail(values.email)) errors.push("Enter a valid email address.");
  if (values.email.length > 254) errors.push("Email must be 254 characters or fewer.");
  if (!required(values.document_type) || values.document_type.length > 40) {
    errors.push("Document type is required and must be 40 characters or fewer.");
  }
  if (!required(values.document_number) || values.document_number.length > 100) {
    errors.push("Document number is required and must be 100 characters or fewer.");
  }
  if (values.phone.length > 40) errors.push("Phone must be 40 characters or fewer.");
  if (values.address.length > 255) errors.push("Address must be 255 characters or fewer.");
  if (values.occupation.length > 120) errors.push("Occupation must be 120 characters or fewer.");
  if (values.monthly_income && !numberAtLeastZero(values.monthly_income)) {
    errors.push("Monthly income must be a non-negative number with up to two decimal places.");
  }
  if (!minLength(password, 10)) errors.push("Password must be at least 10 characters.");
  if (password !== confirmation) errors.push("Password confirmation does not match.");
  return errors;
}

function renderRegistration(res, values, errors, status = 422) {
  return res.status(status).render("pages/register", {
    title: "Register | Microcredit Manager",
    values,
    errors,
  });
}

export function showRegistration(_req, res) {
  res.render("pages/register", {
    title: "Register | Microcredit Manager",
    values: {},
  });
}

export async function register(req, res) {
  const values = registrationValues(req.body);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const confirmation = typeof req.body.password_confirmation === "string"
    ? req.body.password_confirmation
    : "";
  const errors = registrationErrors(values, password, confirmation);
  if (errors.length) return renderRegistration(res, values, errors);

  const connection = await pool.getConnection();
  let userId;
  let clientId;
  try {
    await connection.beginTransaction();
    const [existingEmail] = await connection.execute(
      `SELECT id FROM users WHERE email = ?
       UNION SELECT id FROM clients WHERE email = ? LIMIT 1`,
      [values.email, values.email],
    );
    if (existingEmail.length) {
      await connection.rollback();
      return renderRegistration(res, values, ["An account with this email already exists."]);
    }
    const [existingDocument] = await connection.execute(
      "SELECT id FROM clients WHERE document_number = ? LIMIT 1",
      [values.document_number],
    );
    if (existingDocument.length) {
      await connection.rollback();
      return renderRegistration(res, values, ["A client with this document number already exists."]);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [userResult] = await connection.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'CLIENT')",
      [values.full_name, values.email, passwordHash],
    );
    userId = userResult.insertId;
    const [clientResult] = await connection.execute(
      `INSERT INTO clients
        (user_id, full_name, email, document_type, document_number, phone,
         address, occupation, monthly_income, status, verification_status, registered_via)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'PENDING', 'SELF')`,
      [
        userId,
        values.full_name,
        values.email,
        values.document_type,
        values.document_number,
        values.phone || null,
        values.address || null,
        values.occupation || null,
        values.monthly_income || null,
      ],
    );
    clientId = clientResult.insertId;
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      const field = error.message.includes("document")
        ? "A client with this document number already exists."
        : "An account with this email already exists.";
      return renderRegistration(res, values, [field]);
    }
    throw error;
  } finally {
    connection.release();
  }

  await log({
    userId,
    action: "CLIENT_REGISTERED",
    entity: "CLIENT",
    entityId: clientId,
  });
  await new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
  req.session.user = {
    id: userId,
    name: values.full_name,
    email: values.email,
    role: "CLIENT",
  };
  req.flash("success", "Registration complete. Your account is waiting for verification.");
  return res.redirect("/portal");
}
