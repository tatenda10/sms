-- Add status and condition columns to fixed_assets table

ALTER TABLE fixed_assets 
ADD COLUMN status VARCHAR(50) DEFAULT 'Active' AFTER location;

ALTER TABLE fixed_assets 
ADD COLUMN `condition` VARCHAR(50) NULL AFTER status;

-- Add index for status
CREATE INDEX idx_asset_status ON fixed_assets(status);

