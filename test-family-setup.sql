-- Create some test family relationships
-- Assuming hikerbikerwriter@gmail.com and hikebikebrew775@gmail.com should be family members

-- Get person_ids for both users
SELECT person_id, email FROM users WHERE email IN ('hikerbikerwriter@gmail.com', 'hikebikebrew775@gmail.com');

-- Check current familyline data
SELECT * FROM familyline WHERE person_id IN (
  SELECT person_id FROM users WHERE email IN ('hikerbikerwriter@gmail.com', 'hikebikebrew775@gmail.com')
);

-- Example family JSON structure:
-- {
--   "people": [
--     {
--       "name": "Family Member Name",
--       "email": "family@example.com", 
--       "relationship": "spouse"
--     }
--   ]
-- }

-- To test family sharing, we could update the familyline for hikerbikerwriter@gmail.com
-- to include hikebikebrew775@gmail.com as a family member
