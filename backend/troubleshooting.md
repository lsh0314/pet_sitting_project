# 宠物管理功能故障排除指南

## 问题描述

在微信小程序中访问"我的宠物"页面时，出现以下错误：

```
index.js? [sm]:56 获取宠物列表失败: Error: 请求失败
```

## 问题诊断

通过测试，我们发现：

1. **后端 API 服务器正常运行**：

   - 服务器在端口 3000 上运行
   - 根路径(`/`)返回正常响应
   - 宠物 API 路径(`/api/pet`)存在，但需要认证令牌

2. **可能的问题原因**：
   - 认证令牌不存在或无效
   - API 请求 URL 配置错误
   - API 响应格式与前端期望不匹配

## 解决方案

### 1. 检查认证令牌

确保用户已经登录，并且`token`已经正确保存在本地存储中：

```javascript
// 在微信开发者工具的控制台中运行
wx.getStorageSync("token");
```

如果没有令牌或令牌为空，需要先登录。

### 2. 检查 API 基础 URL 配置

确保`app.js`中的`apiBaseUrl`配置正确：

```javascript
// 在app.js中
globalData: {
  apiBaseUrl: 'http://localhost:3000', // 开发环境
  // apiBaseUrl: 'https://api.petsitting.com', // 生产环境
  // ...
}
```

### 3. 检查 API 请求格式

确保请求头中包含正确的认证信息：

```javascript
{
  'Authorization': 'Bearer ' + token
}
```

### 4. 使用调试模式

在 URL 参数中添加`debug=1`来启用调试模式：

```
/pages/my/pets/index?debug=1
```

这将显示调试按钮，可以运行更详细的测试。

### 5. 检查后端 API 响应格式

确保后端 API 返回的数据格式与前端期望的一致：

```javascript
// 期望的响应格式
[
  {
    id: 1,
    name: "宠物名称",
    photo: "照片URL",
    breed: "品种",
    age: "年龄",
    gender: "性别",
    weight: "体重",
  },
  // ...
];
```

### 6. 修复 API 请求库

我们已经更新了`utils/api.js`文件，添加了更详细的错误处理和调试信息。

### 7. 检查网络连接

确保微信开发者工具可以访问本地服务器：

- 如果使用真机预览，确保手机和电脑在同一网络
- 如果使用模拟器，确保没有网络限制

## 测试步骤

1. 启动后端服务器：

   ```
   cd backend && node app.js
   ```

2. 运行 API 测试：

   ```
   cd backend && node test-api.js
   ```

3. 在微信开发者工具中打开项目

4. 确保已登录

5. 访问"我的宠物"页面：

   ```
   /pages/my/pets/index?debug=1
   ```

6. 如果仍有问题，点击"运行调试测试"按钮，查看控制台输出

## 常见问题

1. **端口被占用**：

   - 使用`netstat -ano | findstr :3000`(Windows)或`lsof -i :3000`(Mac/Linux)检查
   - 关闭占用端口的程序或修改配置使用其他端口

2. **跨域问题**：

   - 确保后端已启用 CORS
   - 检查`app.js`中是否正确配置了 CORS 中间件

3. **认证失败**：
   - 检查 token 是否正确
   - 检查后端认证中间件是否正确验证 token
