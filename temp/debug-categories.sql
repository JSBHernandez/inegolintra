-- Query to check the actual data in training_modules table
SELECT id, title, category, CHAR_LENGTH(category) as category_length, 
       HEX(category) as category_hex,
       description, isActive, createdAt, updatedAt 
FROM training_modules 
ORDER BY id DESC 
LIMIT 5;