INSERT INTO "User" ("id","email","phoneNumber","name","role","password","createdAt","updatedAt")
SELECT gen_random_uuid(), 'admin@ousol.com', '+10000000000', 'Admin', 'ADMIN',
        '$2b$12$glI0PHsYeStpEwJukVbq9eRcIvAZShaeFzBNLxDXf9ieWuyUEd.H6', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'admin@ousol.com');