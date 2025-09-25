-- Make totalContract column nullable in client_cases table
ALTER TABLE client_cases 
MODIFY COLUMN totalContract DECIMAL(10, 2) NULL;
