-- Add closing tracking fields to accounting_periods table

ALTER TABLE accounting_periods
ADD COLUMN IF NOT EXISTS closed_at DATETIME NULL AFTER status,
ADD COLUMN IF NOT EXISTS closed_by INT NULL AFTER closed_at,
ADD CONSTRAINT fk_period_closed_by FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_period_status ON accounting_periods(status);
CREATE INDEX idx_period_closed_by ON accounting_periods(closed_by);

