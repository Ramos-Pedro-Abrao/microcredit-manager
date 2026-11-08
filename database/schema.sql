-- Create the application database with a Unicode character set and collation.
CREATE DATABASE IF NOT EXISTS microcredit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE microcredit;

-- Application users and their authentication/authorization state.
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'MANAGER', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Prevent duplicate account emails.
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Application accounts and roles';

-- Borrower profile and unique identity document.
CREATE TABLE IF NOT EXISTS clients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(180) NOT NULL,
  document_type VARCHAR(40) NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  phone VARCHAR(40) NULL,
  address VARCHAR(255) NULL,
  occupation VARCHAR(120) NULL,
  monthly_income DECIMAL(14,2) NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Each identity document belongs to at most one client.
  UNIQUE KEY clients_document_number_unique (document_number),
  KEY clients_status_idx (status),
  -- Incomes are optional, but a stored income cannot be negative.
  CONSTRAINT clients_monthly_income_nonnegative CHECK (
    monthly_income IS NULL OR monthly_income >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Borrowers and contact details';

-- Loan agreements; client and approving user references are indexed below.
CREATE TABLE IF NOT EXISTS loans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  principal_amount DECIMAL(14,2) NOT NULL,
  interest_rate DECIMAL(7,4) NOT NULL,
  interest_type ENUM('SIMPLE', 'COMPOUND') NOT NULL,
  term_months INT UNSIGNED NOT NULL,
  frequency ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY') NOT NULL,
  start_date DATE NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'ACTIVE', 'PAID', 'DEFAULTED', 'CANCELLED')
    NOT NULL DEFAULT 'PENDING',
  approved_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY loans_client_id_idx (client_id),
  KEY loans_approved_by_idx (approved_by),
  KEY loans_status_idx (status),
  -- Retain loans when clients are referenced; clear the approver if that account is removed.
  CONSTRAINT loans_client_fk FOREIGN KEY (client_id)
    REFERENCES clients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT loans_approved_by_fk FOREIGN KEY (approved_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  -- Loan principal and term must be positive, while a zero rate is valid.
  CONSTRAINT loans_principal_positive CHECK (principal_amount > 0),
  CONSTRAINT loans_interest_rate_nonnegative CHECK (interest_rate >= 0),
  CONSTRAINT loans_term_months_positive CHECK (term_months > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Loan terms and approval status';

-- Scheduled repayment amounts for each loan.
CREATE TABLE IF NOT EXISTS installments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_id BIGINT UNSIGNED NOT NULL,
  number INT UNSIGNED NOT NULL,
  due_date DATE NOT NULL,
  principal_part DECIMAL(14,2) NOT NULL,
  interest_part DECIMAL(14,2) NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (id),
  -- A loan cannot have two installments with the same sequence number.
  UNIQUE KEY installments_loan_number_unique (loan_id, number),
  KEY installments_due_date_idx (due_date),
  KEY installments_status_idx (status),
  CONSTRAINT installments_loan_fk FOREIGN KEY (loan_id)
    REFERENCES loans (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- Parts and payments must be nonnegative and consistent with the total.
  CONSTRAINT installments_number_positive CHECK (number > 0),
  CONSTRAINT installments_principal_nonnegative CHECK (principal_part >= 0),
  CONSTRAINT installments_interest_nonnegative CHECK (interest_part >= 0),
  CONSTRAINT installments_total_positive CHECK (total_amount > 0),
  CONSTRAINT installments_paid_within_total CHECK (
    paid_amount >= 0 AND paid_amount <= total_amount
  ),
  CONSTRAINT installments_parts_match_total CHECK (
    total_amount = principal_part + interest_part
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Scheduled loan repayments';

-- Payment records are retained permanently and reversed using reversed_at.
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_id BIGINT UNSIGNED NOT NULL,
  installment_id BIGINT UNSIGNED NULL,
  amount DECIMAL(14,2) NOT NULL,
  method ENUM('CASH', 'TRANSFER', 'MOBILE') NOT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by BIGINT UNSIGNED NOT NULL,
  reversed_at TIMESTAMP NULL,
  notes TEXT NULL,
  PRIMARY KEY (id),
  KEY payments_loan_id_idx (loan_id),
  KEY payments_installment_id_idx (installment_id),
  KEY payments_received_by_idx (received_by),
  -- Referenced financial records and receiving users cannot be deleted.
  CONSTRAINT payments_loan_fk FOREIGN KEY (loan_id)
    REFERENCES loans (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT payments_installment_fk FOREIGN KEY (installment_id)
    REFERENCES installments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT payments_received_by_fk FOREIGN KEY (received_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- A payment must have a positive amount.
  CONSTRAINT payments_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable payment records; reversals are timestamped';

-- Audit trail of user actions and affected entities.
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY audit_logs_user_id_idx (user_id),
  KEY audit_logs_entity_lookup_idx (entity, entity_id),
  -- Keep the actor account while its audit records exist.
  CONSTRAINT audit_logs_user_fk FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Append-only record of important application actions';

-- Reset these triggers when re-importing the schema; payment/audit rows are never deleted.
DROP TRIGGER IF EXISTS payments_prevent_delete;
DROP TRIGGER IF EXISTS audit_logs_prevent_delete;

DELIMITER //
CREATE TRIGGER payments_prevent_delete
BEFORE DELETE ON payments
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Payments cannot be deleted; reverse the payment instead';
END//

CREATE TRIGGER audit_logs_prevent_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit log records cannot be deleted';
END//
DELIMITER ;