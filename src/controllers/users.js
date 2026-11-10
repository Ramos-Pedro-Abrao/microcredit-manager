import bcrypt from "bcryptjs";
import {
  createUser,
  findById,
  listUsers,
  updatePassword,
  updateUser,
} from "../models/users.js";
import { log } from "../utils/audit.js";
import {
  email as isEmail,
  minLength,
  required,
} from "../utils/validators.js";

const roles = ["ADMIN", "MANAGER", "OPERATOR"];

function idFromRequest(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    res.status(404).render("pages/404", {
      title: "User not found",
      message: "The requested user could not be found.",
    });
    return null;
  }
  return req.params.id;
}

export async function index(_req, res) {
  const users = await listUsers();
  res.render("pages/users/index", {
    title: "Users",
    users,
  });
}

export function newUser(_req, res) {
  res.render("pages/users/form", {
    title: "Create user",
    heading: "Create user",
    action: "/users",
    values: { role: "OPERATOR" },
  });
}

export async function create(req, res) {
  const values = {
    name: typeof req.body.name === "string" ? req.body.name.trim() : "",
    email: typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "",
    role: typeof req.body.role === "string" ? req.body.role : "",
  };
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const errors = [];
  if (!required(values.name)) errors.push("Name is required.");
  if (!isEmail(values.email)) errors.push("Enter a valid email address.");
  if (!roles.includes(values.role)) errors.push("Choose a valid role.");
  if (!minLength(password, 10)) errors.push("Password must be at least 10 characters.");
  if (errors.length) {
    return res.status(422).render("pages/users/form", {
      title: "Create user",
      heading: "Create user",
      action: "/users",
      values,
      errors,
    });
  }

  try {
    const id = await createUser({
      ...values,
      passwordHash: await bcrypt.hash(password, 12),
    });
    await log({
      userId: req.session.user.id,
      action: "USER_CREATED",
      entity: "USER",
      entityId: id,
      details: { email: values.email, role: values.role },
    });
    req.flash("success", "User created successfully.");
    return res.redirect("/users");
  } catch (error) {
    if (error.code !== "ER_DUP_ENTRY") throw error;
    return res.status(422).render("pages/users/form", {
      title: "Create user",
      heading: "Create user",
      action: "/users",
      values,
      errors: ["A user with this email already exists."],
    });
  }
}

export async function editForm(req, res) {
  const id = idFromRequest(req, res);
  if (!id) return;
  const user = await findById(id);
  if (!user) {
    return res.status(404).render("pages/404", {
      title: "User not found",
      message: "The requested user could not be found.",
    });
  }
  res.render("pages/users/form", {
    title: "Edit user",
    heading: "Edit user",
    action: `/users/${user.id}/edit`,
    values: user,
    editing: true,
  });
}

export async function update(req, res) {
  const id = idFromRequest(req, res);
  if (!id) return;
  const user = await findById(id);
  if (!user) {
    return res.status(404).render("pages/404", {
      title: "User not found",
      message: "The requested user could not be found.",
    });
  }
  const values = {
    name: typeof req.body.name === "string" ? req.body.name.trim() : "",
    email: user.email,
    role: typeof req.body.role === "string" ? req.body.role : "",
    is_active: typeof req.body.is_active === "string" ? req.body.is_active : "",
  };
  const isActive = values.is_active === "1";
  const errors = [];
  if (!required(values.name)) errors.push("Name is required.");
  if (!roles.includes(values.role)) errors.push("Choose a valid role.");
  if (!["0", "1"].includes(req.body.is_active)) errors.push("Choose whether this user is active.");
  if (
    String(user.id) === String(req.session.user.id)
    && (!isActive || values.role !== "ADMIN")
  ) {
    errors.push("You cannot deactivate or demote your own account.");
  }
  if (errors.length) {
    return res.status(422).render("pages/users/form", {
      title: "Edit user",
      heading: "Edit user",
      action: `/users/${user.id}/edit`,
      values,
      errors,
      editing: true,
    });
  }

  await updateUser({
    id: user.id,
    name: values.name,
    role: values.role,
    isActive,
  });
  await log({
    userId: req.session.user.id,
    action: "USER_UPDATED",
    entity: "USER",
    entityId: user.id,
    details: { role: values.role, is_active: isActive },
  });
  req.flash("success", "User updated successfully.");
  return res.redirect("/users");
}

export async function resetPasswordForm(req, res) {
  const id = idFromRequest(req, res);
  if (!id) return;
  const user = await findById(id);
  if (!user) {
    return res.status(404).render("pages/404", {
      title: "User not found",
      message: "The requested user could not be found.",
    });
  }
  res.render("pages/users/password", {
    title: "Reset password",
    user,
  });
}

export async function resetPassword(req, res) {
  const id = idFromRequest(req, res);
  if (!id) return;
  const user = await findById(id);
  if (!user) {
    return res.status(404).render("pages/404", {
      title: "User not found",
      message: "The requested user could not be found.",
    });
  }
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!minLength(password, 10)) {
    return res.status(422).render("pages/users/password", {
      title: "Reset password",
      user,
      errors: ["Password must be at least 10 characters."],
    });
  }
  await updatePassword(user.id, await bcrypt.hash(password, 12));
  await log({
    userId: req.session.user.id,
    action: "USER_PASSWORD_RESET",
    entity: "USER",
    entityId: user.id,
  });
  req.flash("success", "Password reset successfully.");
  return res.redirect("/users");
}
