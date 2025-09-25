-- Add status column to client_cases table
ALTER TABLE client_cases 
ADD COLUMN status VARCHAR(50) DEFAULT 'Active' NOT NULL;

-- Update existing records to have 'Active' status
UPDATE client_cases SET status = 'Active' WHERE status IS NULL;

-- Optional: Add an index for better query performance
CREATE INDEX idx_client_cases_status ON client_cases(status);
