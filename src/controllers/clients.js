import {
  createClient,
  findClientById,
  listClients,
  updateClient,
} from "../models/clients.js";
import { log } from "../utils/audit.js";
import {
  numberAtLeastZero,
  required,
} from "../utils/validators.js";

const clientStatuses = ["ACTIVE", "INACTIVE", "BLACKLISTED"];
const canChangeStatus = (user) => ["ADMIN", "MANAGER"].includes(user.role);

function clientValues(body = {}) {
  return {
    full_name: typeof body.full_name === "string" ? body.full_name.trim() : "",
    document_type: typeof body.document_type === "string" ? body.document_type.trim() : "",
    document_number: typeof body.document_number === "string" ? body.document_number.trim() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    address: typeof body.address === "string" ? body.address.trim() : "",
    occupation: typeof body.occupation === "string" ? body.occupation.trim() : "",
    monthly_income: typeof body.monthly_income === "string" ? body.monthly_income.trim() : "",
  };
}

function clientErrors(values) {
  const errors = [];
  if (!required(values.full_name)) errors.push("Full name is required.");
  if (!required(values.document_type)) errors.push("Document type is required.");
  if (!required(values.document_number)) errors.push("Document number is required.");
  if (values.monthly_income !== "" && !numberAtLeastZero(values.monthly_income)) {
    errors.push("Monthly income must be a non-negative number with up to two decimal places.");
  }
  return errors;
}

function paginationPages(page, totalPages, search, status) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  return Array.from({ length: totalPages }, (_, index) => {
    const number = index + 1;
    const params = new URLSearchParams(query);
    params.set("page", String(number));
    return {
      number,
      active: number === page,
      href: `/clients?${params.toString()}`,
    };
  });
}

export async function index(req, res) {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const requestedStatus = typeof req.query.status === "string" ? req.query.status : "";
  const status = clientStatuses.includes(requestedStatus) ? requestedStatus : "";
  const requestedPage = Number.parseInt(req.query.page, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listClients({ search, status, page, limit: 10 });
  res.render("pages/clients/index", {
    title: "Clients",
    ...result,
    search,
    status,
    pages: paginationPages(result.page, result.totalPages, search, status),
    canChangeStatus: canChangeStatus(req.session.user),
  });
}

export function newClient(_req, res) {
  res.render("pages/clients/form", {
    title: "Create client",
    heading: "Create client",
    action: "/clients",
    values: {},
  });
}

export async function create(req, res) {
  const values = clientValues(req.body);
  const errors = clientErrors(values);
  if (errors.length) {
    return res.status(422).render("pages/clients/form", {
      title: "Create client",
      heading: "Create client",
      action: "/clients",
      values,
      errors,
    });
  }

  try {
    const id = await createClient({
      ...values,
      monthly_income: values.monthly_income || null,
    });
    await log({
      userId: req.session.user.id,
      action: "CLIENT_CREATED",
      entity: "CLIENT",
      entityId: id,
      details: { full_name: values.full_name },
    });
    req.flash("success", "Client created successfully.");
    return res.redirect(`/clients/${id}`);
  } catch (error) {
    if (error.code !== "ER_DUP_ENTRY") throw error;
    return res.status(422).render("pages/clients/form", {
      title: "Create client",
      heading: "Create client",
      action: "/clients",
      values,
      errors: ["A client with this document number already exists."],
    });
  }
}

export async function show(req, res) {
  const client = await findClientById(req.params.id);
  if (!client) {
    return res.status(404).render("pages/404", {
      title: "Client not found",
      message: "The requested client could not be found.",
    });
  }
  res.render("pages/clients/show", {
    title: client.full_name,
    client,
    canChangeStatus: canChangeStatus(req.session.user),
  });
}

export async function editForm(req, res) {
  const client = await findClientById(req.params.id);
  if (!client) {
    return res.status(404).render("pages/404", {
      title: "Client not found",
      message: "The requested client could not be found.",
    });
  }
  res.render("pages/clients/form", {
    title: "Edit client",
    heading: "Edit client",
    action: `/clients/${client.id}/edit`,
    values: client,
    canChangeStatus: canChangeStatus(req.session.user),
    editing: true,
  });
}

export async function update(req, res) {
  const existing = await findClientById(req.params.id);
  if (!existing) {
    return res.status(404).render("pages/404", {
      title: "Client not found",
      message: "The requested client could not be found.",
    });
  }
  const values = clientValues(req.body);
  const errors = clientErrors(values);
  const mayChangeStatus = canChangeStatus(req.session.user);
  const status = mayChangeStatus && clientStatuses.includes(req.body.status)
    ? req.body.status
    : existing.status;
  if (mayChangeStatus && req.body.status && !clientStatuses.includes(req.body.status)) {
    errors.push("Choose a valid client status.");
  }
  if (errors.length) {
    return res.status(422).render("pages/clients/form", {
      title: "Edit client",
      heading: "Edit client",
      action: `/clients/${existing.id}/edit`,
      values: { ...values, status },
      errors,
      canChangeStatus: mayChangeStatus,
      editing: true,
    });
  }

  try {
    await updateClient({
      ...values,
      monthly_income: values.monthly_income || null,
      status,
      id: existing.id,
    });
  } catch (error) {
    if (error.code !== "ER_DUP_ENTRY") throw error;
    return res.status(422).render("pages/clients/form", {
      title: "Edit client",
      heading: "Edit client",
      action: `/clients/${existing.id}/edit`,
      values: { ...values, status },
      errors: ["A client with this document number already exists."],
      canChangeStatus: mayChangeStatus,
      editing: true,
    });
  }

  await log({
    userId: req.session.user.id,
    action: "CLIENT_UPDATED",
    entity: "CLIENT",
    entityId: existing.id,
    details: { full_name: values.full_name },
  });
  if (existing.status !== status) {
    await log({
      userId: req.session.user.id,
      action: "CLIENT_STATUS_CHANGED",
      entity: "CLIENT",
      entityId: existing.id,
      details: { from: existing.status, to: status },
    });
  }
  req.flash("success", "Client updated successfully.");
  return res.redirect(`/clients/${existing.id}`);
}
