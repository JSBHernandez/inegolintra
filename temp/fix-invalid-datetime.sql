-- Fix invalid datetime values in training_modules table
-- This script will update any invalid datetime values (0000-00-00 00:00:00) with valid dates

-- Fix training_modules table
UPDATE training_modules 
SET updatedAt = createdAt 
WHERE updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL;

-- Fix any invalid createdAt values by setting them to current time
UPDATE training_modules 
SET createdAt = NOW() 
WHERE createdAt = '0000-00-00 00:00:00' OR createdAt IS NULL;

-- Fix training_module_content table if it exists
UPDATE training_module_content 
SET updatedAt = createdAt 
WHERE updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL;

UPDATE training_module_content 
SET createdAt = NOW() 
WHERE createdAt = '0000-00-00 00:00:00' OR createdAt IS NULL;

-- Verify the fix by checking for any remaining invalid dates
SELECT 'training_modules with invalid dates' as table_name, COUNT(*) as count
FROM training_modules 
WHERE createdAt = '0000-00-00 00:00:00' OR updatedAt = '0000-00-00 00:00:00' 
   OR createdAt IS NULL OR updatedAt IS NULL

UNION ALL

SELECT 'training_module_content with invalid dates' as table_name, COUNT(*) as count
FROM training_module_content 
WHERE createdAt = '0000-00-00 00:00:00' OR updatedAt = '0000-00-00 00:00:00' 
   OR createdAt IS NULL OR updatedAt IS NULL;