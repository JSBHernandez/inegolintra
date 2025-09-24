-- Change training module category from enum to string
ALTER TABLE training_modules 
MODIFY COLUMN category VARCHAR(255) NOT NULL;

-- Drop the category index since it's no longer an enum
DROP INDEX idx_training_modules_category ON training_modules;

-- Update existing categories to be more readable
UPDATE training_modules 
SET category = CASE 
  WHEN category = 'VISAS' THEN 'Visas'
  WHEN category = 'IMMIGRATION_LAW' THEN 'Immigration Law'
  WHEN category = 'CUSTOMER_SERVICE' THEN 'Customer Service'
  WHEN category = 'TECHNOLOGY' THEN 'Technology'
  WHEN category = 'COMPLIANCE' THEN 'Compliance'
  WHEN category = 'SAFETY' THEN 'Safety'
  WHEN category = 'OTHER' THEN 'Other'
  ELSE category
END;