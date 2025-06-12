# 数据库规则 (database.md)

## 1. Schema 是唯一标准

- 数据库的表结构、字段名、数据类型等，必须严格遵守 `/database/schema.sql` 文件中的定义。
- 在对数据库结构进行任何修改前，必须先更新此规则文件或相关的迁移文件。

## 2. 命名规范

- **表名 (tables)**: 使用复数形式的蛇形命名法 (snake_case)，例如 `users`, `order_reports`。
- **字段名 (columns)**: 使用蛇形命名法 (snake_case)，例如 `user_id`, `created_at`。

## 3. 数据完整性

- 必须使用外键（FOREIGN KEY）来维护表之间的引用完整性。
- 关键业务字段（如 `orders.price`, `users.wechat_openid`）必须设置为 `NOT NULL`。

## 4. 数据库迁移

- 对于本项目的规模，当需要修改表结构时，允许直接编写 `ALTER TABLE` 语句。
- 任何修改都应记录在一个新的 SQL 文件中，而不是直接修改 `schema.sql`，以便追踪变更历史。
