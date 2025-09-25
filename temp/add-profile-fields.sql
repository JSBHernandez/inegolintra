-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN address VARCHAR(500),
ADD COLUMN country VARCHAR(100),
ADD COLUMN personalPhone VARCHAR(20),
ADD COLUMN emergencyPhone VARCHAR(20),
ADD COLUMN emergencyContactName VARCHAR(255),
ADD COLUMN profilePhoto VARCHAR(500);
