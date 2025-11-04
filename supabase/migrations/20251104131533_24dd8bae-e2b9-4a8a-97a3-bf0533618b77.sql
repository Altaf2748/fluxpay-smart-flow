-- Set all active offers to never expire (year 2099)
UPDATE offers 
SET valid_to = '2099-12-31 23:59:59+00'
WHERE active = true;