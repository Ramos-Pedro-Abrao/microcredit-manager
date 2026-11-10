USE microcredit;

ALTER TABLE users
  MODIFY COLUMN role ENUM('ADMIN', 'MANAGER', 'OPERATOR', 'CLIENT')
    NOT NULL DEFAULT 'OPERATOR';

ALTER TABLE clients
  ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id,
  ADD COLUMN email VARCHAR(254) NULL AFTER full_name,
  ADD COLUMN verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED')
    NOT NULL DEFAULT 'PENDING' AFTER status,
  ADD COLUMN verified_by BIGINT UNSIGNED NULL AFTER verification_status,
  ADD COLUMN verified_at TIMESTAMP NULL AFTER verified_by,
  ADD COLUMN rejection_reason TEXT NULL AFTER verified_at,
  ADD COLUMN registered_via ENUM('SELF', 'STAFF') NOT NULL DEFAULT 'STAFF' AFTER rejection_reason;

UPDATE clients
SET verification_status = 'VERIFIED',
    verified_at = COALESCE(created_at, CURRENT_TIMESTAMP);

ALTER TABLE clients
  MODIFY COLUMN registered_via ENUM('SELF', 'STAFF') NOT NULL,
  ADD UNIQUE KEY clients_user_id_unique (user_id),
  ADD UNIQUE KEY clients_email_unique (email),
  ADD KEY clients_verification_status_idx (verification_status),
  ADD KEY clients_verified_by_idx (verified_by),
  ADD CONSTRAINT clients_user_fk FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT clients_verified_by_fk FOREIGN KEY (verified_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE loan_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  term_months INT UNSIGNED NOT NULL,
  frequency ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY') NOT NULL,
  purpose TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT NULL,
  approved_interest_rate DECIMAL(7,4) NULL,
  approved_amount DECIMAL(14,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY loan_requests_client_id_idx (client_id),
  KEY loan_requests_reviewed_by_idx (reviewed_by),
  KEY loan_requests_status_idx (status),
  CONSTRAINT loan_requests_client_fk FOREIGN KEY (client_id)
    REFERENCES clients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT loan_requests_reviewed_by_fk FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT loan_requests_amount_positive CHECK (amount > 0),
  CONSTRAINT loan_requests_term_months_positive CHECK (term_months > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Client loan applications awaiting staff review';
