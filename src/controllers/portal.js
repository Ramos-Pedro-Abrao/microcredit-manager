import {
  findClientByUserId,
  updateOwnClientProfile,
} from "../models/clients.js";
import {
  cancelForClient,
  createLoanRequest,
  findPendingForClient,
  listForClient,
} from "../models/loan-requests.js";
import { log } from "../utils/audit.js";
import { numberAtLeastZero, required } from "../utils/validators.js";

const frequencies = ["WEEKLY", "BIWEEKLY", "MONTHLY"];

function renderNotFound(res) {
  return res.status(404).render("pages/404", {
    title: "Not found",
    message: "The requested account data could not be found.",
  });
}

export async function index(req, res) {
  const client = await findClientByUserId(req.session.user.id);
  if (!client) return renderNotFound(res);
  const requests = await listForClient(client.id);
  return res.render("pages/portal/index", {
    title: "Client portal",
    client,
    requests,
  });
}

export async function profile(req, res) {
  const client = await findClientByUserId(req.session.user.id);
  if (!client) return renderNotFound(res);
  return res.render("pages/portal/profile", {
    title: "My profile",
    client,
  });
}

export async function updateProfile(req, res) {
  const client = await findClientByUserId(req.session.user.id);
  if (!client) return renderNotFound(res);
  const values = {
    phone: typeof req.body.phone === "string" ? req.body.phone.trim() : "",
    address: typeof req.body.address === "string" ? req.body.address.trim() : "",
    occupation: typeof req.body.occupation === "string" ? req.body.occupation.trim() : "",
    monthly_income: typeof req.body.monthly_income === "string"
      ? req.body.monthly_income.trim()
      : "",
  };
  const errors = values.monthly_income && !numberAtLeastZero(values.monthly_income)
    ? ["Monthly income must be a non-negative number with up to two decimal places."]
    : [];
  if (errors.length) {
    return res.status(422).render("pages/portal/profile", {
      title: "My profile",
      client: { ...client, ...values },
      errors,
    });
  }
  await updateOwnClientProfile(req.session.user.id, values);
  req.flash("success", "Profile updated successfully.");
  return res.redirect("/portal/profile");
}

export async function newRequest(req, res) {
  const client = await findClientByUserId(req.session.user.id);
  if (!client) return renderNotFound(res);
  if (client.verification_status !== "VERIFIED") {
    return res.status(403).render("pages/portal/request-blocked", {
      title: "Verification required",
      client,
    });
  }
  const pendingRequest = await findPendingForClient(client.id);
  if (pendingRequest) {
    return res.status(409).render("pages/portal/request-blocked", {
      title: "Pending request exists",
      client,
      message: "You already have a pending loan request. Wait for it to be reviewed before submitting another.",
    });
  }
  return res.render("pages/portal/request-form", {
    title: "New loan request",
    values: {},
  });
}

export async function createRequest(req, res) {
  const client = await findClientByUserId(req.session.user.id);
  if (!client) return renderNotFound(res);
  if (client.verification_status !== "VERIFIED") {
    return res.status(403).render("pages/portal/request-blocked", {
      title: "Verification required",
      client,
    });
  }
  const values = {
    amount: typeof req.body.amount === "string" ? req.body.amount.trim() : "",
    term_months: typeof req.body.term_months === "string" ? req.body.term_months.trim() : "",
    frequency: typeof req.body.frequency === "string" ? req.body.frequency : "",
    purpose: typeof req.body.purpose === "string" ? req.body.purpose.trim() : "",
  };
  const errors = [];
  if (!numberAtLeastZero(values.amount) || /^0(?:\.0{1,2})?$/.test(values.amount)) {
    errors.push("Amount must be greater than zero.");
  }
  if (!/^\d+$/.test(values.term_months)
    || Number(values.term_months) < 1
    || Number(values.term_months) > 60) {
    errors.push("Term must be between 1 and 60 months.");
  }
  if (!frequencies.includes(values.frequency)) errors.push("Choose a valid repayment frequency.");
  if (!required(values.purpose)) errors.push("Purpose is required.");
  if (errors.length) {
    return res.status(422).render("pages/portal/request-form", {
      title: "New loan request",
      values,
      errors,
    });
  }

  if (await findPendingForClient(client.id)) {
    return res.status(409).render("pages/portal/request-blocked", {
      title: "Pending request exists",
      client,
      message: "You already have a pending loan request. Wait for it to be reviewed before submitting another.",
    });
  }
  let id;
  try {
    id = await createLoanRequest(client.id, values);
  } catch (error) {
    if (error.code !== "PENDING_REQUEST_EXISTS") throw error;
    return res.status(409).render("pages/portal/request-blocked", {
      title: "Pending request exists",
      client,
      message: "You already have a pending loan request. Wait for it to be reviewed before submitting another.",
    });
  }
  await log({
    userId: req.session.user.id,
    action: "LOAN_REQUEST_CREATED",
    entity: "LOAN_REQUEST",
    entityId: id,
  });
  req.flash("success", "Loan request submitted for review.");
  return res.redirect("/portal");
}

export async function cancelRequest(req, res) {
  if (!/^\d+$/.test(req.params.id)) return renderNotFound(res);
  const client = await findClientByUserId(req.session.user.id);
  if (!client) return renderNotFound(res);
  const changed = await cancelForClient(req.params.id, client.id);
  if (!changed) return renderNotFound(res);
  await log({
    userId: req.session.user.id,
    action: "LOAN_REQUEST_CANCELLED",
    entity: "LOAN_REQUEST",
    entityId: req.params.id,
  });
  req.flash("success", "Loan request cancelled.");
  return res.redirect("/portal");
}
