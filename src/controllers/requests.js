import {
  findLoanRequestById,
  listLoanRequests,
  reviewLoanRequest,
} from "../models/loan-requests.js";
import { log } from "../utils/audit.js";
import { numberAtLeastZero, required } from "../utils/validators.js";

const requestStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

function requestPages(page, totalPages, status) {
  return Array.from({ length: totalPages }, (_, index) => {
    const number = index + 1;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(number));
    return { number, active: number === page, href: `/requests?${params}` };
  });
}

function notFound(res) {
  return res.status(404).render("pages/404", {
    title: "Request not found",
    message: "The requested loan request could not be found.",
  });
}

export async function index(req, res) {
  const requestedStatus = typeof req.query.status === "string" ? req.query.status : "";
  const status = requestStatuses.includes(requestedStatus) ? requestedStatus : "";
  const requestedPage = Number.parseInt(req.query.page, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listLoanRequests({ status, page, limit: 10 });
  return res.render("pages/requests/index", {
    title: "Loan requests",
    ...result,
    status,
    pages: requestPages(result.page, result.totalPages, status),
  });
}

export async function show(req, res) {
  if (!/^\d+$/.test(req.params.id)) return notFound(res);
  const request = await findLoanRequestById(req.params.id);
  if (!request) return notFound(res);
  return res.render("pages/requests/show", {
    title: `Loan request #${request.id}`,
    request,
  });
}

export async function review(req, res) {
  if (!/^\d+$/.test(req.params.id)) return notFound(res);
  const request = await findLoanRequestById(req.params.id);
  if (!request) return notFound(res);
  const decision = typeof req.body.decision === "string" ? req.body.decision : "";
  const reviewNotes = typeof req.body.review_notes === "string"
    ? req.body.review_notes.trim()
    : "";
  const approvedAmount = typeof req.body.approved_amount === "string"
    ? req.body.approved_amount.trim()
    : "";
  const interestRate = typeof req.body.approved_interest_rate === "string"
    ? req.body.approved_interest_rate.trim()
    : "";
  const errors = [];
  if (request.status !== "PENDING") errors.push("Only pending requests can be reviewed.");
  if (request.verification_status !== "VERIFIED") {
    errors.push("The client must be verified before reviewing this request.");
  }
  if (!["APPROVED", "REJECTED"].includes(decision)) errors.push("Choose approve or reject.");
  if (decision === "APPROVED") {
    if (!numberAtLeastZero(approvedAmount) || /^0(?:\.0{1,2})?$/.test(approvedAmount)) {
      errors.push("Approved amount must be greater than zero.");
    }
    if (!/^\d{1,3}(?:\.\d{1,4})?$/.test(interestRate)) {
      errors.push("Enter a valid non-negative interest rate.");
    }
  }
  if (decision === "REJECTED" && !required(reviewNotes)) {
    errors.push("A reason is required to reject the request.");
  }
  const values = {
    decision,
    approved_amount: approvedAmount || String(request.amount),
    approved_interest_rate: interestRate,
    review_notes: reviewNotes,
  };
  if (errors.length) {
    return res.status(422).render("pages/requests/show", {
      title: `Loan request #${request.id}`,
      request,
      values,
      errors,
    });
  }

  const updated = await reviewLoanRequest(request.id, req.session.user.id, {
    status: decision,
    review_notes: reviewNotes,
    approved_amount: approvedAmount,
    approved_interest_rate: interestRate,
  });
  if (!updated) {
    req.flash("error", "This request could not be reviewed; confirm it is still pending and the client is verified.");
    return res.redirect(`/requests/${request.id}`);
  }
  await log({
    userId: req.session.user.id,
    action: decision === "APPROVED" ? "LOAN_REQUEST_APPROVED" : "LOAN_REQUEST_REJECTED",
    entity: "LOAN_REQUEST",
    entityId: request.id,
    details: decision === "APPROVED"
      ? { approved_amount: approvedAmount, approved_interest_rate: interestRate, review_notes: reviewNotes }
      : { reason: reviewNotes },
  });
  req.flash("success", `Loan request ${decision.toLowerCase()}.`);
  return res.redirect(`/requests/${request.id}`);
}
