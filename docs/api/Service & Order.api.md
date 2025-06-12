

# 📦 服务与订单模块 API 接口文档

## ✅ 1. 发布服务订单

- **接口路径**：`POST /api/order`
- **请求方法**：POST  
- **描述**：宠物主发布服务订单，可选公开发布或私密邀约某位帮溜员

### 请求参数

| 参数名       | 类型   | 必填 | 描述                           |
| ------------ | ------ | ---- | ------------------------------ |
| petId        | number | 是   | 选择服务的宠物 ID              |
| serviceType  | string | 是   | 服务类型（walk/feed/boarding） |
| serviceDate  | string | 是   | 服务日期（YYYY-MM-DD）         |
| startTime    | string | 是   | 服务起始时间（HH:mm）          |
| endTime      | string | 是   | 服务结束时间（HH:mm）          |
| address      | string | 是   | 服务地点（模糊地址）           |
| remarks      | string | 否   | 备注信息                       |
| price        | number | 是   | 订单价格（元）                 |
| targetSitter | number | 否   | 邀约接单的指定帮溜员用户ID     |

### 响应示例

```json
{
  "success": true,
  "orderId": 456
}
```

------

## ✅ 2. 获取订单广场（帮溜员端）

- **接口路径**：`GET /api/order/public`
- **请求方法**：GET
- **描述**：帮溜员查看所有公开发布的待接订单

### 查询参数（可选）

| 参数名      | 类型   | 描述                 |
| ----------- | ------ | -------------------- |
| serviceType | string | 筛选服务类型         |
| sortBy      | string | `price` / `distance` |
| page        | number | 页码，默认 1         |
| size        | number | 每页条数，默认 10    |

### 响应示例

```json
[
  {
    "orderId": 456,
    "petName": "豆豆",
    "serviceType": "walk",
    "timeRange": "09:00 - 10:00",
    "address": "黄浦区XX小区",
    "price": 50
  },
  ...
]
```

------

## ✅ 3. 接单（帮溜员）

- **接口路径**：`POST /api/order/:id/accept`
- **请求方法**：POST
- **描述**：帮溜员接下某个订单

### 路径参数

| 参数名 | 类型 | 描述   |
| ------ | ---- | ------ |
| id     | int  | 订单ID |

### 响应示例

```json
{
  "success": true,
  "message": "接单成功"
}
```

------

## ✅ 4. 获取我的订单列表（双方通用）

- **接口路径**：`GET /api/order/my`
- **请求方法**：GET
- **描述**：查看自己身份下所有相关订单

### 查询参数

| 参数名 | 类型   | 描述                             |
| ------ | ------ | -------------------------------- |
| status | string | 筛选订单状态（可多选）           |
| role   | string | 当前身份：`pet_owner` / `sitter` |

### 响应示例

```json
[
  {
    "orderId": 456,
    "petName": "豆豆",
    "status": "待服务",
    "serviceType": "walk",
    "timeRange": "09:00 - 10:00",
    "price": 50
  },
  ...
]
```

------

## ✅ 5. 获取订单详情

- **接口路径**：`GET /api/order/:id`
- **请求方法**：GET
- **描述**：查看订单的完整信息

### 路径参数

| 参数名 | 类型 | 描述    |
| ------ | ---- | ------- |
| id     | int  | 订单 ID |

### 响应示例

```json
{
  "orderId": 456,
  "status": "服务中",
  "pet": {
    "name": "豆豆",
    "breed": "柯基"
  },
  "serviceType": "walk",
  "sitter": {
    "id": 88,
    "nickname": "溜溜小能手"
  },
  "owner": {
    "id": 12,
    "nickname": "豆豆妈"
  },
  "track": [],
  "report": [],
  "payment": {
    "price": 50,
    "isPaid": true
  }
}
```

------

## ✅ 6. 支付订单（宠物主）

- **接口路径**：`POST /api/order/:id/pay`
- **请求方法**：POST
- **描述**：宠物主支付订单费用，进入托管流程

### 响应示例

```json
{
  "success": true,
  "paymentUrl": "https://pay.wechat.com/xxx"
}
```

------

## ✅ 7. 开始服务 / 结束服务（帮溜员）

- **接口路径**：
  - `POST /api/order/:id/start` （开始服务）
  - `POST /api/order/:id/complete` （完成服务）
- **请求方法**：POST
- **描述**：服务过程控制，记录轨迹和日志起止点

### 响应示例

```json
{
  "success": true
}
```

------

## ✅ 8. 上传服务报告（帮溜员）

- **接口路径**：`POST /api/order/:id/report`
- **请求方法**：POST
- **描述**：帮溜员上传照片、视频、文字，汇报宠物服务状态

### 请求参数

| 参数名 | 类型     | 描述             |
| ------ | -------- | ---------------- |
| text   | string   | 文字描述         |
| images | string[] | 图片 URL 列表    |
| video  | string   | 视频 URL（可选） |

### 响应示例

```json
{
  "success": true
}
```

------

## ✅ 8a. 上报GPS轨迹点（帮溜员）

- **接口路径**：`POST /api/order/:id/track`
- **请求方法**：POST
- **描述**：针对遛狗服务，帮溜员在服务中上报地理位置坐标点。

### 请求参数
| 参数名    | 类型   | 必填 | 描述 |
| --------- | ------ | ---- | ---- |
| latitude  | number | 是   | 纬度 |
| longitude | number | 是   | 经度 |

### 响应示例
```json
{
  "success": true
}
```

---

## ✅ 9. 宠物主确认完成

- **接口路径**：`POST /api/order/:id/confirm`
- **请求方法**：POST
- **描述**：宠物主确认服务完成，托管费用转账到帮溜员钱包

### 响应示例

```json
{
  "success": true
}
```

------

## ✅ 10. 取消订单

- **接口路径**：`POST /api/order/:id/cancel`
- **请求方法**：POST
- **描述**：在服务开始前允许取消订单

### 响应示例

```json
{
  "success": true,
  "message": "订单已取消"
}
```

------

## ✅ 统一订单状态定义（status 字段）

| 状态值    | 描述           |
| --------- | -------------- |
| pending   | 待接单         |
| accepted  | 已接单，待支付 |
| paid      | 已支付，待服务 |
| ongoing   | 服务中         |
| completed | 已完成         |
| cancelled | 已取消         |

------

## ✅ 错误格式（统一）

```json
{
  "success": false,
  "errorCode": "ORDER_NOT_FOUND",
  "message": "订单不存在或无权访问"
}
```

------

> 💡 建议所有订单接口统一判断用户身份（角色）是否匹配订单方，避免越权操作。