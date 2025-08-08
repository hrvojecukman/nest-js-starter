# Admin Authentication

This document describes the admin authentication system for the Ousol backend.

## Overview

Admins can log in using email and password instead of the OTP-based system used by regular users.

## Admin Endpoints

### Admin Login

- **POST** `/api/v1/auth/admin/login`
- **Body:**
  ```json
  {
    "email": "admin@ousol.com",
    "password": "admin123"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "name": "Admin Name",
      "email": "admin@ousol.com",
      "role": "ADMIN"
    }
  }
  ```

### Admin Register (First Admin Only)

- **POST** `/api/v1/auth/admin/register`
- **Body:**
  ```json
  {
    "email": "admin@ousol.com",
    "password": "admin123",
    "name": "Admin Name"
  }
  ```
- **Note:** Only one admin account can exist. Subsequent calls will return a 409 Conflict error.

## Default Admin Credentials

After running the seed script, the default admin credentials are:

- **Email:** `admin@ousol.com`
- **Password:** `admin123`

## Security Features

1. **Password Hashing:** Passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Authentication:** Admins receive JWT tokens for API access
3. **Role-Based Access:** Admin endpoints are protected with role-based guards
4. **Single Admin:** Only one admin account can exist in the system

## Usage

1. **Login as Admin:**

   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@ousol.com","password":"admin123"}'
   ```

2. **Use JWT Token for Admin Endpoints:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/subscription/admin/plans \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Database Schema

The `User` model now includes:

- `password` field (optional, for admin users)
- `email` field (required for admin login)

## Regular User Authentication

Regular users continue to use the OTP-based authentication system:

- Phone number + OTP verification
- No password required
- Different endpoints: `/api/v1/auth/initiate` and `/api/v1/auth/verify-otp`

## Subscription Management (Admin)

### Create Subscription for User

- **POST** `/api/v1/subscription/admin/subscriptions`
- **Body:**
  ```json
  {
    "userId": "user-uuid-here",
    "planId": "plan-uuid-here",
    "paymentProvider": "manual",
    "startedAt": "2025-08-08T06:59:56.718Z",
    "expiresAt": "2025-09-08T06:59:56.718Z",
    "autoRenew": true,
    "status": "active",
    "externalReference": "optional-reference"
  }
  ```
- **Note:** All fields except `userId`, `planId`, and `paymentProvider` are optional.

### Update Subscription Status

- **PUT** `/api/v1/subscription/admin/subscriptions/{subscriptionId}/status`
- **Body:**
  ```json
  {
    "status": "active",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "autoRenew": true
  }
  ```

### Extend Subscription

- **POST** `/api/v1/subscription/admin/subscriptions/{subscriptionId}/extend`
- **Body:**
  ```json
  {
    "daysToExtend": 30
  }
  ```

### Get All Subscriptions

- **GET** `/api/v1/subscription/admin/subscriptions`
- **Query Parameters:**
  - `search`: Search by user name, email, or plan name
  - `status`: Filter by subscription status
  - `paymentProvider`: Filter by payment provider
  - `userRole`: Filter by user role
  - `planId`: Filter by plan ID
  - `startedAfter`: Filter by start date (ISO string)
  - `startedBefore`: Filter by start date (ISO string)
  - `expiresAfter`: Filter by expiration date (ISO string)
  - `expiresBefore`: Filter by expiration date (ISO string)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 100)
