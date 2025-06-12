# 🌟 评价与售后模块 API 接口文档

------

## ✅ 1. 提交订单评价（双向）

- **接口路径**：`POST /api/review/:orderId`
- **请求方法**：POST  
- **描述**：订单完成后，宠物主或帮溜员均可对对方进行评价

### 路径参数

| 参数名  | 类型 | 描述    |
| ------- | ---- | ------- |
| orderId | int  | 订单 ID |

### 请求参数

| 参数名    | 类型     | 必填 | 描述                                     |
| --------- | -------- | ---- | ---------------------------------------- |
| rating    | number   | 是   | 星级评分（1~5）                          |
| tags      | string[] | 否   | 评价标签（如：守时、宠物喜欢、不专业等） |
| comment   | string   | 否   | 文字评价                                 |
| anonymous | boolean  | 否   | 是否匿名                                 |

### 响应示例

```json
{
  "success": true,
  "message": "评价已提交"
}
```

> ⚠️ 每个用户只能对订单评价一次，系统支持“双方评价后互相可见”机制。

------

## ✅ 2. 获取订单评价详情

- **接口路径**：`GET /api/review/:orderId`
- **请求方法**：GET
- **描述**：查看该订单下的双向评价（仅评价完成后才展示）

### 响应示例

```json
{
  "ownerReview": {
    "rating": 5,
    "comment": "非常准时，狗狗很喜欢她！",
    "tags": ["守时", "有爱心"],
    "anonymous": false
  },
  "sitterReview": {
    "rating": 4,
    "comment": "主人沟通清晰，狗狗也很乖",
    "tags": ["沟通顺畅", "宠物乖巧"],
    "anonymous": true
  }
}
```

------

## ✅ 3. 查看某用户的历史评价

- **接口路径**：`GET /api/review/user/:userId`
- **请求方法**：GET
- **描述**：查看某个用户的全部被评价记录（用于帮溜员主页或宠物主信用）

### 查询参数（可选）

| 参数名 | 类型   | 描述                             |
| ------ | ------ | -------------------------------- |
| role   | string | 被评价身份（pet_owner / sitter） |
| page   | number | 默认 1                           |
| size   | number | 默认 10                          |

### 响应示例

```json
[
  {
    "orderId": 123,
    "rating": 5,
    "comment": "很细心，照片拍得很好",
    "tags": ["沟通顺畅", "有责任心"],
    "createdAt": "2025-06-01T10:00:00Z"
  },
  ...
]
```

------

## ✅ 4. 申诉发起（售后申请）

- **接口路径**：`POST /api/complaint/:orderId`
- **请求方法**：POST
- **描述**：针对某个订单发起申诉，进入平台售后处理流程

### 请求参数

| 参数名   | 类型     | 必填 | 描述                                         |
| -------- | -------- | ---- | -------------------------------------------- |
| type     | string   | 是   | 申诉类型（服务未到位、宠物异常、虚假信息等） |
| reason   | string   | 是   | 申诉详细说明                                 |
| evidence | string[] | 否   | 证据图片或视频 URL 列表                      |

### 响应示例

```json
{
  "success": true,
  "message": "申诉已提交，平台将尽快处理"
}
```

------

## ✅ 5. 查看我提交的申诉记录

- **接口路径**：`GET /api/complaint/my`
- **请求方法**：GET
- **描述**：查看当前用户发起的所有售后/申诉记录

### 响应示例

```json
[
  {
    "id": 77,
    "orderId": 456,
    "type": "宠物异常",
    "status": "processing", // success / rejected
    "submittedAt": "2025-06-10T12:00:00Z"
  },
  ...
]
```

------

## ✅ 6. 管理员处理申诉（平台后台）

> ⚠️ 此接口仅开放给管理员使用，Web 后台操作，前端不调用。

- **接口路径**：`POST /api/admin/complaint/:id/resolve`
- **请求方法**：POST
- **描述**：管理员对申诉进行裁决处理

### 请求参数

| 参数名  | 类型   | 描述                                             |
| ------- | ------ | ------------------------------------------------ |
| result  | string | 判定结果：`refund` / `reject` / `partial_refund` |
| comment | string | 平台处理说明备注                                 |

### 响应示例

```json
{
  "success": true,
  "message": "裁决完成，双方已通知"
}
```

------

## ✅ 投诉类型建议枚举值（type 字段）

- service_incomplete：服务未按时完成
- pet_injured：宠物受伤
- sitter_no_show：帮溜员未出现
- fake_info：资料不实
- false_review：恶意评价
- item_lost：物品丢失
- other：其他

------

## ✅ 错误返回格式（统一）

```json
{
  "success": false,
  "errorCode": "ALREADY_REVIEWED",
  "message": "您已评价过该订单"
}
```

这份文档支持：

✅ **双向评价**（用户与用户） 
✅ **申诉维权**（用户与平台） 
✅ **后台裁决**（平台与双方）