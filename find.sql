
SELECT 'COMPANY' as type, id, name, slug FROM Company WHERE name LIKE '%cube%' OR slug LIKE '%cube%';
SELECT 'USER' as type, id, name, username, email FROM User WHERE name LIKE '%cube%' OR username LIKE '%cube%' OR email LIKE '%cube%';
