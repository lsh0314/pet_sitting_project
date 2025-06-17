# 宠物寄养小程序

## 配置说明

### API 密钥配置

为了保护敏感信息（如 API 密钥）不被上传到 GitHub，我们使用了本地配置文件。请按照以下步骤设置：

1. 在 `utils` 目录下找到 `config.example.js` 文件
2. 复制该文件并重命名为 `config.js`
3. 在 `config.js` 中填入您的实际 API 密钥：

```javascript
// API密钥配置
const apiKeys = {
  // 腾讯地图开发者密钥
  qqMapKey: "YOUR_ACTUAL_QQ_MAP_KEY", // 替换为您的实际密钥
};
```

4. 确保 `config.js` 已添加到 `.gitignore` 中，避免提交敏感信息

> **注意**：请勿将包含实际 API 密钥的 `config.js` 文件提交到版本控制系统中。

## 开发说明

[在这里添加其他开发相关说明]
