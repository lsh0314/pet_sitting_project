# 🧾 用户与账户模块 API 接口文档

## ✅ 1. 用户微信登录授权

- **接口路径**：`POST /api/auth/wechat-login`
- **请求方法**：POST  
- **描述**：通过微信登录，首次登录自动创建用户账号。

### 请求参数

| 参数名 | 类型   | 必填 | 描述                          |
| ------ | ------ | ---- | ----------------------------- |
| code   | string | 是   | 微信登录凭证（wx.login 获取） |

### 响应示例

```json
{
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": 123,
    "nickname": "喵喵的主人",
    "avatar": "https://cdn.com/avatar.jpg",
    "role": "pet_owner",
    "hasProfile": false
  }
}
```

------

## ✅ 2. 获取当前用户信息

- **接口路径**：`GET /api/user/profile`
- **请求方法**：GET
- **描述**：获取当前登录用户的基本信息
- **认证要求**：需要携带 `Authorization: Bearer <token>`

### 响应示例

```json
{
  "id": 123,
  "nickname": "小王",
  "avatar": "https://cdn.com/avatar.jpg",
  "gender": "male",
  "role": "pet_owner"
}
```

------

## ✅ 3. 更新用户资料

- **接口路径**：`PUT /api/user/profile`
- **请求方法**：PUT
- **描述**：更新当前用户的基础资料

### 请求参数

| 参数名   | 类型   | 必填 | 描述                                |
| -------- | ------ | ---- | ----------------------------------- |
| nickname | string | 否   | 用户昵称                            |
| avatar   | string | 否   | 头像 URL                            |
| gender   | string | 否   | 性别（"male" / "female" / "other"） |

### 响应示例

```json
{
  "success": true,
  "message": "用户资料更新成功"
}
```

------

## ✅ 4. 切换用户角色

- **接口路径**：`POST /api/user/role`
- **请求方法**：POST
- **描述**：用户切换身份角色（宠物主 / 帮溜员）

### 请求参数

| 参数名 | 类型   | 必填 | 描述                            |
| ------ | ------ | ---- | ------------------------------- |
| role   | string | 是   | 新角色：`pet_owner` 或 `sitter` |

### 响应示例

```json
{
  "success": true,
  "newRole": "sitter"
}
```

------

## ✅ 5. 实名认证提交

- **接口路径**：`POST /api/sitter/identity`
- **请求方法**：POST
- **描述**：提交帮溜员的实名认证材料

### 请求参数

| 参数名   | 类型   | 必填 | 描述                 |
| -------- | ------ | ---- | -------------------- |
| id_front | string | 是   | 身份证正面照片 URL   |
| id_back  | string | 是   | 身份证反面照片 URL   |
| selfie   | string | 是   | 手持身份证自拍照 URL |

### 响应示例

```json
{
  "success": true,
  "status": "pending"
}
```

------

## ✅ 6. 获取实名认证状态

- **接口路径**：`GET /api/sitter/identity`
- **请求方法**：GET
- **描述**：获取帮溜员的实名认证审核状态

### 响应示例

```json
{
  "status": "pending",  // 也可能是 "success" 或 "rejected"
  "reason": "证件照片模糊"  // 若 status 为 rejected 时显示
}
```

------

## ✅ 统一错误返回格式

当接口出错时，统一返回如下结构，便于前端统一处理：

```json
{
  "success": false,
  "errorCode": "INVALID_TOKEN",
  "message": "登录信息无效，请重新登录"
}
```

> 常见错误码建议：
>
> - `UNAUTHORIZED`：未登录或 token 失效
> - `INVALID_PARAM`：参数错误
> - `FORBIDDEN`：无权限访问
> - `NOT_FOUND`：资源不存在
> - `SERVER_ERROR`：服务器内部错误

