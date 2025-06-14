-- 设置数据库默认字符集
ALTER DATABASE pet_sitting_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 设置表的字符集
ALTER TABLE pets CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE sitter_profiles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE sitter_services CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 修复宠物名称
UPDATE pets SET name = '咪咪' WHERE id = 1;
UPDATE pets SET name = '旺财' WHERE id = 3; 