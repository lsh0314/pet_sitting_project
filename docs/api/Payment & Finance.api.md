# 💰 支付与财务模块 API 接口文档

---

## ✅ 1. 发起微信支付（宠物主）

- **接口路径**：`POST /api/payment/order/:id`
- **请求方法**：POST  
- **描述**：发起微信支付（预支付），支付成功后金额将托管在平台中

### 路径参数

| 参数名 | 类型 | 描述    |
| ------ | ---- | ------- |
| id     | int  | 订单 ID |

### 响应示例

```json
{
  "success": true,
  "paymentParams": {
    "appId": "wx123456",
    "timeStamp": "1718123456",
    "nonceStr": "abc123",
    "package": "prepay_id=wx2012345678",
    "signType": "RSA",
    "paySign": "..."
  }
}
```

> 💡 用于前端调用 `wx.requestPayment()` 进行支付

------

## ✅ 2. 微信支付回调通知（平台接收）

- **接口路径**：`POST /api/payment/notify`
- **请求方法**：POST
- **描述**：微信服务端回调接口，用于确认支付是否成功

### 微信通知格式（示例）

```xml
<xml>
  <appid>wx2421b1c4370ec43b</appid>
  <mch_id>10000100</mch_id>
  <transaction_id>1008450740201411110005820873</transaction_id>
  ...
</xml>
```

### 响应示例（平台返回给微信）

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
</xml>
```

------

## ✅ 3. 查询钱包信息（帮溜员）

- **接口路径**：`GET /api/wallet`
- **请求方法**：GET
- **描述**：获取当前帮溜员的账户余额、总收入、冻结金额

### 响应示例

```json
{
  "balance": 320.00,         // 可提现金额
  "frozen": 100.00,          // 正在服务中的冻结金额
  "totalIncome": 1260.00     // 累计收入
}
```

------

## ✅ 4. 获取账单记录

- **接口路径**：`GET /api/wallet/transactions`
- **请求方法**：GET
- **描述**：查询交易明细记录，包括收入、支出、提现等

### 查询参数（可选）

| 参数名 | 类型   | 描述                                   |
| ------ | ------ | -------------------------------------- |
| type   | string | 可选值：`income`, `withdraw`, `refund` |
| page   | number | 默认 1                                 |
| size   | number | 默认 10                                |

### 响应示例

```json
[
  {
    "type": "income",
    "amount": 60,
    "description": "完成订单 #456",
    "timestamp": "2025-06-10T14:00:00Z"
  },
  {
    "type": "withdraw",
    "amount": -100,
    "description": "微信零钱提现",
    "timestamp": "2025-06-09T10:00:00Z"
  }
]
```

------

## ✅ 5. 发起提现申请（帮溜员）

- **接口路径**：`POST /api/wallet/withdraw`
- **请求方法**：POST
- **描述**：帮溜员将余额提现到微信零钱或银行卡，平台后台审核打款

### 请求参数

| 参数名 | 类型   | 必填 | 描述              |
| ------ | ------ | ---- | ----------------- |
| amount | number | 是   | 提现金额（元）    |
| method | string | 是   | `wechat` / `bank` |

### 响应示例

```json
{
  "success": true,
  "message": "提现申请已提交，等待审核"
}
```

------

## ✅ 6. 查询提现申请记录

- **接口路径**：`GET /api/wallet/withdraw`
- **请求方法**：GET
- **描述**：查看所有提现记录及审核进度

### 响应示例

```json
[
  {
    "id": 12,
    "amount": 100,
    "method": "wechat",
    "status": "processing", // success / rejected
    "requestedAt": "2025-06-10T12:34:00Z"
  }
]
```

------

## ✅ 统一错误返回格式

```json
{
  "success": false,
  "errorCode": "INSUFFICIENT_BALANCE",
  "message": "余额不足，无法提现"
}
```

------

## ✅ 数据安全建议

- 所有涉及金额的接口都需校验登录状态和身份
- 提现接口需加防刷（验证码/频率限制）
- 支付状态写入数据库前需通过签名验证