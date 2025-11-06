-- Activate all existing offers that are valid
UPDATE offers 
SET active = true 
WHERE valid_to > NOW();