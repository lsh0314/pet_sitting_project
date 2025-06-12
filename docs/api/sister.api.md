# 🐶 帮溜员模块 API 接口文档

---

## ✅ 1. 获取当前帮溜员个人主页数据

- **接口路径**：`GET /api/sitter/profile`
- **请求方法**：GET  
- **描述**：用于展示 sitter 自己的主页，包括简介、服务配置、可预约时间等

### 响应示例

```json
{
  "id": 88,
  "nickname": "溜溜小能手",
  "avatar": "https://cdn.com/avatar.jpg",
  "bio": "爱宠10年，擅长带大型犬",
  "services": [
    {
      "type": "walk",
      "price": 30
    },
    {
      "type": "boarding",
      "price": 100
    }
  ],
  "serviceArea": "上海市浦东新区",
  "availableDates": ["2025-06-15", "2025-06-16", "2025-06-18"],
  "certifications": ["训犬师证", "兽医助理证"]
}
```

------

## ✅ 2. 编辑服务设置与资料

- **接口路径**：`PUT /api/sitter/profile`
- **请求方法**：PUT
- **描述**：编辑服务类型、价格、简介、可接单区域等信息

### 请求参数（示例）

```json
{
  "bio": "我从小就喜欢动物，拥有丰富照料经验",
  "services": [
    { "type": "walk", "price": 30 },
    { "type": "feed", "price": 50 }
  ],
  "serviceArea": "徐汇区/黄浦区",
  "availableDates": ["2025-06-15", "2025-06-17"],
  "certifications": ["https://cdn.com/cert1.jpg", "https://cdn.com/cert2.jpg"]
}
```

------

## ✅ 3. 获取我的邀约订单

- **接口路径**：`GET /api/sitter/invitations`
- **请求方法**：GET
- **描述**：查看别人主动发给自己的邀约订单

### 响应示例

```json
[
  {
    "orderId": 901,
    "petName": "毛毛",
    "serviceType": "feed",
    "address": "静安区××小区",
    "serviceDate": "2025-06-17",
    "status": "pending",
    "price": 60
  }
]
```

------

## ✅ 4. 接受 / 拒绝邀约

- **接口路径**：`POST /api/sitter/invitations/:orderId/respond`
- **请求方法**：POST
- **描述**：对邀约订单进行回应

### 请求参数

| 参数名 | 类型   | 描述            |
| ------ | ------ | --------------- |
| action | string | accept / reject |

### 响应示例

```json
{
  "success": true,
  "message": "已接受邀约"
}
```

------

## ✅ 5. 查看我的接单日历视图

- **接口路径**：`GET /api/sitter/calendar`
- **请求方法**：GET
- **描述**：按日期维度返回我的服务安排（进行中、已预约）

### 响应示例

```json
[
  {
    "date": "2025-06-15",
    "orders": [
      { "id": 777, "time": "09:00-10:00", "pet": "豆豆", "status": "待服务" }
    ]
  },
  {
    "date": "2025-06-16",
    "orders": []
  }
]
```

------

## ✅ 6. 上传服务资质证书

- **接口路径**：`POST /api/sitter/certifications`
- **请求方法**：POST
- **描述**：上传如训犬师证、宠物照护等证明照片

### 请求参数

| 参数名 | 类型   | 描述            |
| ------ | ------ | --------------- |
| file   | string | 图片 URL（OSS） |

------

## ✅ 7. 获取公开展示主页（供宠物主查看）

- **接口路径**：`GET /api/sitter/:id`
- **请求方法**：GET
- **描述**：用于宠物主查看 sitter 的主页详情

### 响应示例同 `/api/sitter/profile`（只读）

------

## ✅ 8. 获取帮溜员列表（供宠物主发现）

- **接口路径**：`GET /api/sitters`
- **请求方法**：GET
- **描述**：用于宠物主浏览平台上的帮溜员，是“直接邀约”功能的前置步骤。

### 查询参数（可选）

| 参数名 | 类型   | 描述              |
| ------ | ------ | ----------------- |
| page   | number | 页码，默认 1      |
| size   | number | 每页条数，默认 10 |

### 响应示例

```json
[
  {
    "id": 88,
    "nickname": "溜溜小能手",
    "avatar": "[https://cdn.com/avatar.jpg](https://cdn.com/avatar.jpg)",
    "bio": "爱宠10年，擅长带大型犬",
    "rating": 4.9, // 增加一个综合评分
    "serviceArea": "上海市浦东新区"
  },
  {
    "id": 89,
    "nickname": "爱猫人士小张",
    "avatar": "[https://cdn.com/avatar2.jpg](https://cdn.com/avatar2.jpg)",
    "bio": "家里有两只猫，经验丰富",
    "rating": 5.0,
    "serviceArea": "上海市黄浦区"
  }
]
```

## ✅ 统一错误返回格式

```json
{
  "success": false,
  "errorCode": "NOT_SITTER",
  "message": "当前用户不是帮溜员"
}
```

---

## ✅ 总结

| 功能                 | 状态     |
| -------------------- | -------- |
| 服务配置、价格设置   | ✅ 已覆盖 |
| 邀约处理             | ✅ 已覆盖 |
| 我的服务安排（日历） | ✅ 已覆盖 |
| 主页维护与展示       | ✅ 已覆盖 |
| 证书上传             | ✅ 已覆盖 |

