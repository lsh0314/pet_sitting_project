# 🖥️ 管理后台模块 API 接口文档

> 所有接口均需要管理员身份登录，并携带后台专用 token 进行认证。

---

## ✅ 1. 管理员登录

- **接口路径**：`POST /api/admin/login`
- **请求方法**：POST  
- **描述**：管理员后台账号登录

### 请求参数

| 参数名   | 类型   | 必填 | 描述         |
| -------- | ------ | ---- | ------------ |
| username | string | 是   | 管理员用户名 |
| password | string | 是   | 管理员密码   |

### 响应示例

```json
{
  "token": "ADMIN_JWT_TOKEN",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "super_admin"
  }
}
```

------

## ✅ 2. 获取平台数据看板

- **接口路径**：`GET /api/admin/dashboard`
- **请求方法**：GET
- **描述**：获取核心业务数据指标

### 响应示例

```json
{
  "totalUsers": 1582,
  "totalOrders": 987,
  "gmv": 82340,
  "todayOrders": 16,
  "pendingWithdrawals": 3,
  "pendingReviews": 4
}
```

------

## ✅ 3. 用户管理 - 获取用户列表

- **接口路径**：`GET /api/admin/users`
- **请求方法**：GET
- **描述**：查看所有用户基本信息

### 查询参数（可选）

| 参数名 | 类型   | 描述               |
| ------ | ------ | ------------------ |
| role   | string | pet_owner / sitter |
| status | string | active / banned    |
| page   | number | 分页页码           |

### 响应示例

```json
[
  {
    "id": 101,
    "nickname": "豆豆妈",
    "role": "pet_owner",
    "createdAt": "2025-04-01",
    "status": "active"
  },
  ...
]
```

---

## ✅ 4. 订单管理 - 获取订单列表

- **接口路径**：`GET /api/admin/orders`
- **请求方法**：GET  
- **描述**：管理员后台查看全平台订单总览（用于筛查异常、数据统计等）

### 查询参数（可选）

| 参数名   | 类型   | 描述                                   |
| -------- | ------ | -------------------------------------- |
| status   | string | 订单状态筛选（pending/paid/ongoing等） |
| sitterId | number | 指定帮溜员的 ID                        |
| ownerId  | number | 指定宠物主的 ID                        |
| dateFrom | string | 起始日期（YYYY-MM-DD）                 |
| dateTo   | string | 截止日期                               |
| page     | number | 页码（默认 1）                         |
| size     | number | 每页条数（默认 10）                    |

### 响应示例

```json
[
  {
    "orderId": 456,
    "petName": "豆豆",
    "owner": { "id": 12, "nickname": "豆豆妈" },
    "sitter": { "id": 88, "nickname": "小溜" },
    "serviceType": "walk",
    "serviceDate": "2025-06-15",
    "status": "completed",
    "price": 60
  },
  ...
]
```

## ✅ 4a订单管理 - 查看订单详情

- **接口路径**：`GET /api/admin/orders/:id`
- **请求方法**：GET
- **描述**：查看某一笔订单的完整详情，包括用户、服务报告、轨迹、聊天记录等

### 响应示例

```json
{
  "orderId": 456,
  "status": "completed",
  "pet": {
    "id": 10,
    "name": "豆豆",
    "breed": "柯基"
  },
  "owner": {
    "id": 12,
    "nickname": "豆豆妈"
  },
  "sitter": {
    "id": 88,
    "nickname": "小溜"
  },
  "serviceType": "walk",
  "serviceDate": "2025-06-15",
  "timeRange": "09:00-10:00",
  "address": "上海市黄浦区××小区",
  "report": [
    {
      "text": "豆豆今天特别活泼",
      "images": ["https://cdn.com/img1.jpg"],
      "timestamp": "2025-06-15T09:30:00Z"
    }
  ],
  "track": [
    { "lat": 31.234, "lng": 121.489, "time": "2025-06-15T09:10:00Z" },
    { "lat": 31.236, "lng": 121.491, "time": "2025-06-15T09:20:00Z" }
  ],
  "payment": {
    "amount": 60,
    "paid": true,
    "commission": 6,
    "sitterIncome": 54
  }
}
```

---

## ✅ 4b. 订单管理 - 执行退款

- **接口路径**：`POST /api/admin/orders/:id/refund`
- **请求方法**：POST
- **描述**：管理员为指定订单执行退款操作，用于处理纠纷或其它特殊情况。

### 请求参数
| 参数名 | 类型   | 必填 | 描述               |
| ------ | ------ | ---- | ------------------ |
| amount | number | 是   | 退款金额           |
| reason | string | 是   | 退款原因，用于记录 |

### 响应示例
```json
{
  "success": true,
  "message": "退款操作已执行"
}
```

---

## ✅ 5. 用户封禁 / 解封

- **接口路径**：`POST /api/admin/users/:id/status`
- **请求方法**：POST
- **描述**：修改用户状态（封禁 / 解封）

### 请求参数

| 参数名 | 类型   | 必填 | 描述             |
| ------ | ------ | ---- | ---------------- |
| status | string | 是   | active / banned  |
| reason | string | 否   | 封禁理由（可选） |

------

## ✅ 6. 认证审核 - 获取待审核列表

- **接口路径**：`GET /api/admin/verifications`
- **请求方法**：GET
- **描述**：获取所有实名认证或证书认证的待审核项

### 响应示例

```json
[
  {
    "userId": 88,
    "nickname": "溜溜小能手",
    "type": "identity", // identity / certificate
    "submittedAt": "2025-06-08T12:00:00Z"
  }
]
```

------

## ✅ 7. 审核通过 / 驳回

- **接口路径**：`POST /api/admin/verifications/:userId`
- **请求方法**：POST
- **描述**：处理某个帮溜员的实名认证审核结果

### 请求参数

| 参数名  | 类型   | 必填 | 描述                |
| ------- | ------ | ---- | ------------------- |
| result  | string | 是   | approved / rejected |
| comment | string | 否   | 驳回原因（若拒绝）  |

------

## ✅ 8. 提现审核

- **接口路径**：`GET /api/admin/withdrawals`
- **请求方法**：GET
- **描述**：获取所有待处理提现申请

### 响应示例

```json
[
  {
    "id": 32,
    "userId": 88,
    "amount": 150,
    "method": "wechat",
    "status": "processing",
    "requestedAt": "2025-06-09T14:00:00Z"
  }
]
```

------

## ✅ 9. 审核提现申请

- **接口路径**：`POST /api/admin/withdrawals/:id`
- **请求方法**：POST
- **描述**：管理员审批提现申请

### 请求参数

| 参数名  | 类型   | 描述                     |
| ------- | ------ | ------------------------ |
| result  | string | approved / rejected      |
| comment | string | 备注说明（用于通知用户） |

------

## ✅ 10. 投诉管理 - 获取全部申诉工单

- **接口路径**：`GET /api/admin/complaints`
- **请求方法**：GET
- **描述**：查看所有用户提交的售后/纠纷记录

------

## ✅ 11. 投诉详情 + 聊天记录调取

- **接口路径**：`GET /api/admin/complaints/:id`
- **请求方法**：GET
- **描述**：查看单个申诉工单详细内容，包括订单、用户、证据、聊天记录等

------

## ✅ 12. 内容管理 - 获取评价列表

- **接口路径**：`GET /api/admin/reviews`
- **请求方法**：GET
- **描述**：后台查看所有用户发布的评价内容

------

## ✅ 13. 内容审核（隐藏/恢复评价）

- **接口路径**：`POST /api/admin/reviews/:id/moderate`
- **请求方法**：POST
- **描述**：隐藏/恢复用户评价内容（如含敏感词）

### 请求参数

| 参数名 | 类型   | 必填 | 描述         |
| ------ | ------ | ---- | ------------ |
| action | string | 是   | hide / show  |
| reason | string | 否   | 说明隐藏原因 |

------

## ✅ 14. 修改平台配置（如佣金比例）

- **接口路径**：`POST /api/admin/config`
- **请求方法**：POST
- **描述**：修改平台配置参数，如服务类目、佣金比例等

### 请求参数（示例）

```json
{
  "commissionRate": 0.1,  // 平台抽成 10%
  "minWithdrawal": 50
}
```

------

## ✅ 错误返回示例

```json
{
  "success": false,
  "errorCode": "UNAUTHORIZED",
  "message": "管理员权限不足"
}
```

这份文档涵盖了管理员后台核心功能：

- ✅ 用户管理（查找、封禁、身份审核）  
- ✅ 订单/申诉/提现 审核流程  
- ✅ 内容控制与系统配置  

---