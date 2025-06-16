#!/bin/bash

# 执行payments表迁移
echo "执行payments表迁移..."
node execute_migration.js create_payments_table.sql

echo "迁移完成!"