# Admin Subscription Management - JSON Examples

This document provides comprehensive JSON examples for all admin subscription management operations.

## 🔄 **User Subscription Flow**

### **Important Note: One Subscription Per User**

Users can only have **one subscription at a time**. If a user tries to create a new subscription while they already have one, the system will return an error and require them to cancel their current subscription first.

### **User Subscription Steps:**

1. **View Available Plans**: `GET /api/v1/subscription/plans`
2. **Start Checkout**: `POST /api/v1/subscription/checkout`
3. **Complete Payment**: Redirect to checkout URL
4. **Check Status**: `GET /api/v1/subscription`
5. **Cancel if needed**: `POST /api/v1/subscription/cancel` (before creating new one)

## 📋 **1. Create Subscription for User**

### **Basic Example:**

```json
{
  "userId": "1025c75d-dafc-46bf-bf13-48ada8598809",
  "planId": "d9aed2f0-9ce6-4c33-a227-42ab3de7c43f",
  "paymentProvider": "manual",
  "status": "active",
  "autoRenew": true
}
```

### **Complete Example with All Fields:**

```json
{
  "userId": "1025c75d-dafc-46bf-bf13-48ada8598809",
  "planId": "d9aed2f0-9ce6-4c33-a227-42ab3de7c43f",
  "paymentProvider": "manual",
  "startedAt": "2025-08-08T06:59:56.718Z",
  "expiresAt": "2025-09-08T06:59:56.718Z",
  "autoRenew": true,
  "status": "active",
  "externalReference": "ADMIN_CREATED_001"
}
```

### **Different Payment Providers:**

```json
{
  "userId": "user-uuid-here",
  "planId": "plan-uuid-here",
  "paymentProvider": "stripe",
  "externalReference": "cs_test_1234567890"
}
```

```json
{
  "userId": "user-uuid-here",
  "planId": "plan-uuid-here",
  "paymentProvider": "unknown",
  "status": "pending"
}
```

## 📊 **2. Update Subscription Status**

### **Activate Subscription:**

```json
{
  "status": "active",
  "autoRenew": true
}
```

### **Cancel Subscription:**

```json
{
  "status": "canceled",
  "autoRenew": false
}
```

### **Mark as Expired:**

```json
{
  "status": "expired"
}
```

### **Set Pending Status:**

```json
{
  "status": "pending",
  "expiresAt": "2025-09-30T23:59:59.000Z"
}
```

### **Update Expiration Date:**

```json
{
  "status": "active",
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "autoRenew": true
}
```

## ⏰ **3. Extend Subscription**

### **Extend by 30 Days:**

```json
{
  "daysToExtend": 30
}
```

### **Extend by 90 Days:**

```json
{
  "daysToExtend": 90
}
```

### **Extend by 1 Year:**

```json
{
  "daysToExtend": 365
}
```

## 🔍 **4. Query Parameters for Get All Subscriptions**

### **Basic Query:**

```
GET /api/v1/subscription/admin/subscriptions?page=1&limit=10
```

### **Search by User Name:**

```
GET /api/v1/subscription/admin/subscriptions?search=John
```

### **Filter by Status:**

```
GET /api/v1/subscription/admin/subscriptions?status=active
```

### **Filter by User Role:**

```
GET /api/v1/subscription/admin/subscriptions?userRole=BROKER
```

### **Filter by Payment Provider:**

```
GET /api/v1/subscription/admin/subscriptions?paymentProvider=stripe
```

### **Filter by Date Range:**

```
GET /api/v1/subscription/admin/subscriptions?startedAfter=2025-01-01T00:00:00.000Z&startedBefore=2025-12-31T23:59:59.000Z
```

### **Filter by Expiration:**

```
GET /api/v1/subscription/admin/subscriptions?expiresAfter=2025-08-01T00:00:00.000Z&expiresBefore=2025-08-31T23:59:59.000Z
```

### **Complex Filter:**

```
GET /api/v1/subscription/admin/subscriptions?status=active&userRole=BROKER&paymentProvider=manual&page=1&limit=20
```

## 📋 **5. Complete API Examples**

### **Create Subscription:**

```bash
curl -X POST http://localhost:3000/api/v1/subscription/admin/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "userId": "1025c75d-dafc-46bf-bf13-48ada8598809",
    "planId": "d9aed2f0-9ce6-4c33-a227-42ab3de7c43f",
    "paymentProvider": "manual",
    "status": "active",
    "autoRenew": true
  }'
```

### **Update Subscription Status:**

```bash
curl -X PUT http://localhost:3000/api/v1/subscription/admin/subscriptions/9cb99ccb-16ad-4830-aeee-46f567b52c47/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "status": "active",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "autoRenew": true
  }'
```

### **Extend Subscription:**

```bash
curl -X POST http://localhost:3000/api/v1/subscription/admin/subscriptions/9cb99ccb-16ad-4830-aeee-46f567b52c47/extend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "daysToExtend": 30
  }'
```

### **Get All Subscriptions:**

```bash
curl -X GET "http://localhost:3000/api/v1/subscription/admin/subscriptions?status=active&userRole=BROKER&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## 🎯 **Field Descriptions**

### **Required Fields for Create Subscription:**

- `userId`: UUID of the user to create subscription for
- `planId`: UUID of the subscription plan
- `paymentProvider`: "stripe", "manual", or "unknown"

### **Optional Fields for Create Subscription:**

- `startedAt`: ISO date string (defaults to current date)
- `expiresAt`: ISO date string (calculated from plan billing period if not provided)
- `autoRenew`: Boolean (defaults to true)
- `status`: "active", "expired", "canceled", or "pending" (defaults to "active")
- `externalReference`: String for external payment reference

### **Available Statuses:**

- `active`: Subscription is active and user has access
- `expired`: Subscription has expired
- `canceled`: Subscription was canceled
- `pending`: Subscription is pending activation

### **Available Payment Providers:**

- `stripe`: Stripe payment gateway
- `manual`: Manual payment (admin created)
- `unknown`: Unknown payment method

## 🚨 **Error Responses**

### **User Not Found:**

```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### **Plan Not Found:**

```json
{
  "message": "Subscription plan not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### **User Already Has Subscription:**

```json
{
  "message": "User already has a subscription. Please cancel the current subscription before creating a new one.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **Invalid Billing Period:**

```json
{
  "message": "Invalid billing period",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **Unauthorized Access:**

```json
{
  "message": "Unauthorized access",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## 📊 **Response Examples**

### **Successful Subscription Creation:**

```json
{
  "id": "9cb99ccb-16ad-4830-aeee-46f567b52c47",
  "userId": "1025c75d-dafc-46bf-bf13-48ada8598809",
  "planId": "d9aed2f0-9ce6-4c33-a227-42ab3de7c43f",
  "startedAt": "2025-08-08T06:59:56.718Z",
  "expiresAt": "2025-09-08T06:59:56.718Z",
  "autoRenew": true,
  "status": "active",
  "paymentProvider": "manual",
  "externalReference": null,
  "plan": {
    "id": "d9aed2f0-9ce6-4c33-a227-42ab3de7c43f",
    "name": "Broker Plan",
    "description": "Perfect for individual property owners",
    "price": 100,
    "currency": "USD",
    "availableTo": ["BROKER"],
    "billingPeriod": "monthly",
    "createdAt": "2025-08-08T06:33:44.965Z",
    "updatedAt": "2025-08-08T06:33:44.965Z"
  },
  "user": {
    "id": "1025c75d-dafc-46bf-bf13-48ada8598809",
    "name": "Ms. Adrienne Miller",
    "email": "admin@ousol.com",
    "role": "ADMIN"
  }
}
```

### **Subscriptions List Response:**

```json
{
  "subscriptions": [
    {
      "id": "9cb99ccb-16ad-4830-aeee-46f567b52c47",
      "userId": "1025c75d-dafc-46bf-bf13-48ada8598809",
      "planId": "d9aed2f0-9ce6-4c33-a227-42ab3de7c43f",
      "startedAt": "2025-08-08T06:59:56.718Z",
      "expiresAt": "2025-09-08T06:59:56.718Z",
      "autoRenew": true,
      "status": "active",
      "paymentProvider": "manual",
      "externalReference": null,
      "plan": {
        "id": "d9aed2f0-9ce6-4c33-a227-42ab3de7c43f",
        "name": "Broker Plan",
        "description": "Perfect for individual property owners",
        "price": 100,
        "currency": "USD",
        "availableTo": ["BROKER"],
        "billingPeriod": "monthly",
        "createdAt": "2025-08-08T06:33:44.965Z",
        "updatedAt": "2025-08-08T06:33:44.965Z"
      },
      "user": {
        "id": "1025c75d-dafc-46bf-bf13-48ada8598809",
        "name": "Ms. Adrienne Miller",
        "email": "admin@ousol.com",
        "role": "ADMIN"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```
