import bcrypt from "bcryptjs";
import { log } from "../utils/audit.js";
import { email as isEmail, required } from "../utils/validators.js";
import { findByEmail } from "../models/users.js";

const invalidCredentialsMessage = "Invalid email or password";

function safeReturnTo(value) {
  if (
    typeof value === "string"
    && value.startsWith("/")
    && !value.startsWith("//")
    && !value.includes("\\")
  ) {
    return value;
  }
  return "/dashboard";
}

export function showLogin(req, res) {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("pages/login", {
    title: "Sign in | Microcredit Manager",
    returnTo: safeReturnTo(req.query.returnTo),
  });
}

export async function login(req, res) {
  const rawEmail = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const normalizedEmail = rawEmail.toLowerCase();
  const user = required(rawEmail) && isEmail(normalizedEmail)
    ? await findByEmail(normalizedEmail)
    : null;
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!passwordMatches) {
    await log({
      userId: null,
      action: "LOGIN_FAILED",
      entity: "USER",
      entityId: "unknown",
      details: { email: rawEmail },
    });
    return res.status(401).render("pages/login", {
      title: "Sign in | Microcredit Manager",
      returnTo: safeReturnTo(req.body.returnTo),
      error: invalidCredentialsMessage,
      values: { email: rawEmail },
    });
  }

  await new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  await log({
    userId: user.id,
    action: "LOGIN",
    entity: "USER",
    entityId: user.id,
  });
  return res.redirect(safeReturnTo(req.body.returnTo));
}

export async function logout(req, res) {
  const user = req.session.user;
  await log({
    userId: user.id,
    action: "LOGOUT",
    entity: "USER",
    entityId: user.id,
  });
  await new Promise((resolve, reject) => {
    req.session.destroy((error) => error ? reject(error) : resolve());
  });
  res.clearCookie("microcredit.sid");
  return res.redirect("/login");
}
