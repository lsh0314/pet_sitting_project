-- 添加位置坐标字段到orders表
ALTER TABLE `orders` 
ADD COLUMN `location_coords` TEXT NULL COMMENT '位置坐标JSON字符串' AFTER `remarks`;

-- 添加额外字段到order_tracks表
ALTER TABLE `order_tracks` 
ADD COLUMN `address` VARCHAR(512) NULL COMMENT '地址文本' AFTER `longitude`,
ADD COLUMN `distance` INT NULL COMMENT '与服务地址的距离(米)' AFTER `address`,
ADD COLUMN `type` ENUM('start', 'track', 'end') NOT NULL DEFAULT 'track' COMMENT '轨迹点类型' AFTER `distance`;

-- 创建索引
CREATE INDEX `idx_tracks_type` ON `order_tracks` (`type`); 