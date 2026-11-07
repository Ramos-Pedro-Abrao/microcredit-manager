# Database schema

The schema is defined in `backend/prisma/schema.prisma`. Monetary values and interest rates use PostgreSQL `Decimal` columns; no financial value uses floating-point storage. IDs are UUIDs.

## Models

- **User** — Staff account with a unique email, password hash, role (`ADMIN`, `MANAGER`, or `OPERATOR`), active flag, and creation/update timestamps. Users are referenced by loan approvals, received payments, and audit records.
- **Client** — Borrower contact and profile information, with a unique document number and status (`ACTIVE`, `INACTIVE`, or `BLACKLISTED`). A client can have multiple loans.
- **Loan** — Loan terms and lifecycle status for one client. `approvedById` optionally relates to the staff user who approved it. A loan has installments and payments.
- **Installment** — A numbered repayment due on a date, with principal, interest, total, paid amount, and status (`PENDING`, `PARTIAL`, `PAID`, or `OVERDUE`). The loan and installment number are unique together. Payments may optionally be allocated to an installment.
- **Payment** — A recorded amount, payment method, timestamp, receiving user, and optional notes. A database trigger prevents deletion and edits to payment details; the only allowed change is setting `reversedAt` once. Every payment belongs to a loan and may reference one installment.
- **AuditLog** — An action, entity reference, optional JSON details, creation time, and the user who performed the action.

## Indexes and integrity

Foreign-key columns, document number, status fields, and installment due date are indexed. Unique constraints protect user email, client document number, and the installment number within each loan. Prisma relations use restrictive deletion for financial history so referenced loans, users, and clients cannot be silently removed.
