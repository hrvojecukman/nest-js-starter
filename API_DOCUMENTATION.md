# 🏠 Ousol Real Estate API Documentation

## 🛠️ Tech Stack & Infrastructure

### 🏗️ Backend Technology

| Technology            | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| **NestJS**            | Progressive Node.js framework for building scalable applications |
| **Node.js**           | Runtime environment for NestJS                                   |
| **TypeScript**        | Type-safe JavaScript development                                 |
| **PostgreSQL**        | Primary database                                                 |
| **Prisma ORM**        | Database toolkit and ORM                                         |
| **Redis**             | Caching and session storage                                      |
| **JWT**               | Authentication tokens                                            |
| **bcrypt**            | Password hashing                                                 |
| **class-validator**   | Request validation                                               |
| **class-transformer** | Object transformation                                            |

### 🗄️ Database & Storage

| Service        | Purpose          | Configuration                  |
| -------------- | ---------------- | ------------------------------ |
| **PostgreSQL** | Primary database | Connection pooling, migrations |
| **Redis**      | Caching layer    | Session storage, rate limiting |
| **AWS S3**     | File storage     | Media files, documents         |
| **Prisma**     | Database ORM     | Type-safe database queries     |

### 🏗️ NestJS Architecture

| Feature                  | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| **Modules**              | Organized code structure with dependency injection |
| **Controllers**          | Handle HTTP requests and responses                 |
| **Services**             | Business logic and data processing                 |
| **Guards**               | Authentication and authorization                   |
| **Interceptors**         | Request/response transformation                    |
| **Pipes**                | Data validation and transformation                 |
| **Middleware**           | Request processing pipeline                        |
| **Dependency Injection** | Loose coupling and testability                     |

### 📱 Mobile & Frontend Integration

| Technology                   | Purpose              |
| ---------------------------- | -------------------- |
| **Firebase Cloud Messaging** | Push notifications   |
| **Firebase App Check**       | Mobile app security  |
| **CORS Configuration**       | Web frontend support |

---

## 🔌 Third-Party Integrations

### 💳 Payment Processors

| Provider         | Integration | Purpose            | Features                               |
| ---------------- | ----------- | ------------------ | -------------------------------------- |
| **Checkout.com** | Primary     | Payment processing | Cards, digital wallets, bank transfers |
| **Manual Entry** | Admin       | Manual payments    | Admin-created payments                 |

### 📱 Push Notifications

| Service                      | Integration | Purpose              | Features                               |
| ---------------------------- | ----------- | -------------------- | -------------------------------------- |
| **Firebase Cloud Messaging** | Primary     | Push notifications   | Cross-platform delivery                |
| **Firebase Admin SDK**       | Server-side | Notification sending | Topic subscriptions, device management |

### 📧 Communication Services

| Service      | Integration | Purpose             | Features                        |
| ------------ | ----------- | ------------------- | ------------------------------- |
| **Twilio**   | SMS/OTP     | Phone verification  | OTP delivery, SMS notifications |
| **SendGrid** | Email       | Email notifications | Transactional emails, marketing |

### ☁️ Cloud Services

| Service         | Integration  | Purpose       | Features                 |
| --------------- | ------------ | ------------- | ------------------------ |
| **AWS S3**      | File Storage | Media uploads | Image/video storage, CDN |
| **Redis Cloud** | Caching      | Performance   | Session storage, caching |

### 🗺️ Location & Maps

| Service             | Integration | Purpose           | Features                        |
| ------------------- | ----------- | ----------------- | ------------------------------- |
| **Google Maps API** | Maps        | Location services | Geocoding, distance calculation |

---

## 📊 API Usage & Limits

### 📱 Mobile App Integration

#### Flutter App Requirements

- **Firebase App Check**: Required for API access
- **JWT Token**: Include in Authorization header
- **Device Registration**: Register for push notifications

#### Web Frontend Requirements

- **CORS**: Configured for web origins
- **JWT Storage**: Secure token storage

---

## 📋 Table of Contents

- [Authentication](#-authentication-auth)
- [User Management](#-user-management-user)
- [Users Management](#-users-management-users---admin-only)
- [Projects](#-projects-projects)
- [Properties](#-properties-properties)
- [Payments](#-payments-payments)
- [Reservations](#-reservations-reservations)
- [Refunds](#-refunds-refunds)
- [Payment Providers](#-payment-providers-payment-providers)
- [Payment Analytics](#-payment-analytics-payment-analytics)
- [Notifications](#-notifications-notifications)
- [Push Notifications](#-push-notifications-push-notifications)
- [Verification](#-verification-verification)
- [Admin](#-admin-admin)
- [Root](#-root-)
- [Database Structure](#-database-structure)
- [Notes](#-notes)

---

## 🔐 Authentication (`/auth`)

| Method | Endpoint           | Description              | Auth Required |
| ------ | ------------------ | ------------------------ | ------------- |
| `POST` | `/auth/initiate`   | Send OTP to phone number | ❌            |
| `POST` | `/auth/verify-otp` | Verify OTP and login     | ❌            |
| `POST` | `/auth/logout`     | Logout user              | ✅            |
| `POST` | `/auth/refresh`    | Refresh access token     | ✅            |

---

## 👤 User Management (`/user`)

| Method   | Endpoint                           | Description                  | Auth Required |
| -------- | ---------------------------------- | ---------------------------- | ------------- |
| `GET`    | `/user/me`                         | Get current user profile     | ✅            |
| `PATCH`  | `/user/profile`                    | Update user profile          | ✅            |
| `POST`   | `/user/complete-profile/buyer`     | Complete buyer profile       | ✅            |
| `POST`   | `/user/complete-profile/owner`     | Complete owner profile       | ✅            |
| `POST`   | `/user/complete-profile/developer` | Complete developer profile   | ✅            |
| `POST`   | `/user/complete-profile/broker`    | Complete broker profile      | ✅            |
| `PATCH`  | `/user/role-profile`               | Update role-specific profile | ✅            |
| `POST`   | `/user/profile-image`              | Upload profile image         | ✅            |
| `GET`    | `/user/profile-image`              | Get profile image            | ✅            |
| `DELETE` | `/user/profile-image`              | Delete profile image         | ✅            |
| `PATCH`  | `/user/password`                   | Change password              | ✅            |
| `PATCH`  | `/user/email`                      | Update email address         | ✅            |
| `PATCH`  | `/user/phone`                      | Update phone number          | ✅            |

---

## 👥 Users Management (`/users`)

| Method | Endpoint                | Description               | Auth Required | Role Required |
| ------ | ----------------------- | ------------------------- | ------------- | ------------- |
| `GET`  | `/users`                | Get all users (paginated) | ✅            | `ADMIN`       |
| `GET`  | `/users/:id`            | Get user by ID            | ✅            | `ADMIN`       |
| `GET`  | `/users/developers`     | Get all developers        | ❌            | Any           |
| `GET`  | `/users/brokers`        | Get all brokers           | ❌            | Any           |
| `GET`  | `/users/developers/:id` | Get developer by ID       | ❌            | Any           |
| `GET`  | `/users/brokers/:id`    | Get broker by ID          | ❌            | Any           |

---

## 🏢 Projects (`/projects`)

| Method   | Endpoint                              | Description                  | Auth Required |
| -------- | ------------------------------------- | ---------------------------- | ------------- |
| `POST`   | `/projects`                           | Create new project           | ✅            |
| `GET`    | `/projects`                           | Get all projects (paginated) | ❌            |
| `GET`    | `/projects/:id`                       | Get project by ID            | ❌            |
| `GET`    | `/projects/:id/documents`             | Get project documents only   | ❌            |
| `GET`    | `/projects/developer/:developerId`    | Get projects by developer    | ❌            |
| `PATCH`  | `/projects/:id`                       | Update project               | ✅            |
| `DELETE` | `/projects/:id`                       | Delete project               | ✅            |
| `POST`   | `/projects/:id/properties`            | Add properties to project    | ✅            |
| `POST`   | `/projects/:id/media/:type`           | Upload project media         | ✅            |
| `DELETE` | `/projects/:projectId/media/:mediaId` | Delete project media         | ✅            |

---

## 🏠 Properties (`/properties`)

| Method   | Endpoint                                 | Description                    | Auth Required |
| -------- | ---------------------------------------- | ------------------------------ | ------------- |
| `POST`   | `/properties`                            | Create new property            | ✅            |
| `POST`   | `/properties/createMany`                 | Create multiple properties     | ✅            |
| `GET`    | `/properties`                            | Get all properties (paginated) | ❌            |
| `GET`    | `/properties/:id`                        | Get property by ID             | ❌            |
| `GET`    | `/properties/broker/:brokerId`           | Get properties by broker       | ❌            |
| `GET`    | `/properties/developer/:developerId`     | Get properties by developer    | ❌            |
| `PATCH`  | `/properties/:id`                        | Update property                | ✅            |
| `DELETE` | `/properties/:id`                        | Delete property                | ✅            |
| `POST`   | `/properties/:id/media/:type`            | Upload property media          | ✅            |
| `DELETE` | `/properties/:propertyId/media/:mediaId` | Delete property media          | ✅            |

---

## 💳 Payments (`/payments`)

| Method  | Endpoint                         | Description                        | Auth Required | Role Required |
| ------- | -------------------------------- | ---------------------------------- | ------------- | ------------- |
| `POST`  | `/payments/create`               | Create payment session             | ✅            | -             |
| `POST`  | `/payments/create-bulk`          | Create multiple payment sessions   | ✅            | -             |
| `GET`   | `/payments`                      | Get user payments (paginated)      | ✅            | -             |
| `GET`   | `/payments/:id`                  | Get payment details                | ✅            | -             |
| `GET`   | `/payments/property/:propertyId` | Get payments for specific property | ✅            | -             |
| `GET`   | `/payments/status/:status`       | Get payments by status             | ✅            | -             |
| `PATCH` | `/payments/:id/update-status`    | Update payment status              | ✅            | `ADMIN`       |
| `POST`  | `/payments/:id/refund`           | Process refund                     | ✅            | -             |
| `POST`  | `/payments/:id/partial-refund`   | Process partial refund             | ✅            | -             |
| `GET`   | `/payments/:id/refunds`          | Get payment refunds                | ✅            | -             |
| `POST`  | `/payments/:id/cancel`           | Cancel pending payment             | ✅            | -             |
| `POST`  | `/payments/:id/retry`            | Retry failed payment               | ✅            | -             |
| `GET`   | `/payments/analytics/summary`    | Get payment analytics summary      | ✅            | `ADMIN`       |
| `GET`   | `/payments/analytics/revenue`    | Get revenue analytics              | ✅            | `ADMIN`       |
| `GET`   | `/payments/analytics/provider`   | Get provider performance analytics | ✅            | `ADMIN`       |
| `POST`  | `/payments/webhook`              | Handle payment webhooks            | ❌            | -             |
| `POST`  | `/payments/webhook/test`         | Test webhook endpoint              | ✅            | `ADMIN`       |

---

## 🏠 Reservations (`/reservations`)

| Method   | Endpoint                               | Description                       | Auth Required |
| -------- | -------------------------------------- | --------------------------------- | ------------- | ------- |
| `POST`   | `/reservations/create`                 | Create property reservation       | ✅            |
| `GET`    | `/reservations`                        | Get user reservations (paginated) | ✅            |
| `GET`    | `/reservations/:id`                    | Get reservation details           | ✅            |
| `GET`    | `/reservations/property/:propertyId`   | Get reservations for property     | ✅            |
| `PATCH`  | `/reservations/:id/extend`             | Extend reservation expiry         | ✅            |
| `DELETE` | `/reservations/:id`                    | Cancel reservation                | ✅            |
| `POST`   | `/reservations/:id/convert-to-payment` | Convert reservation to payment    | ✅            |
| `GET`    | `/reservations/expired`                | Get expired reservations          | ✅            | `ADMIN` |
| `POST`   | `/reservations/cleanup-expired`        | Clean up expired reservations     | ✅            | `ADMIN` |

---

## 💰 Refunds (`/refunds`)

| Method | Endpoint                      | Description                      | Auth Required | Role Required |
| ------ | ----------------------------- | -------------------------------- | ------------- | ------------- |
| `GET`  | `/refunds`                    | Get all refunds (paginated)      | ✅            | `ADMIN`       |
| `GET`  | `/refunds/:id`                | Get refund details               | ✅            | -             |
| `GET`  | `/refunds/payment/:paymentId` | Get refunds for specific payment | ✅            | -             |
| `POST` | `/refunds/:id/approve`        | Approve refund request           | ✅            | `ADMIN`       |
| `POST` | `/refunds/:id/reject`         | Reject refund request            | ✅            | `ADMIN`       |
| `GET`  | `/refunds/analytics/summary`  | Get refund analytics             | ✅            | `ADMIN`       |
| `POST` | `/refunds/bulk-approve`       | Approve multiple refunds         | ✅            | `ADMIN`       |

---

## 🏦 Payment Providers (`/payment-providers`)

| Method  | Endpoint                            | Description                     | Auth Required | Role Required |
| ------- | ----------------------------------- | ------------------------------- | ------------- | ------------- |
| `GET`   | `/payment-providers`                | Get available payment providers | ❌            | -             |
| `GET`   | `/payment-providers/:provider`      | Get provider configuration      | ✅            | `ADMIN`       |
| `PATCH` | `/payment-providers/:provider`      | Update provider configuration   | ✅            | `ADMIN`       |
| `POST`  | `/payment-providers/:provider/test` | Test provider connection        | ✅            | `ADMIN`       |
| `GET`   | `/payment-providers/status`         | Get provider status             | ✅            | `ADMIN`       |
| `POST`  | `/payment-providers/switch`         | Switch default payment provider | ✅            | `ADMIN`       |

---

## 📊 Payment Analytics (`/payment-analytics`)

| Method | Endpoint                        | Description                  | Auth Required | Role Required |
| ------ | ------------------------------- | ---------------------------- | ------------- | ------------- |
| `GET`  | `/payment-analytics/dashboard`  | Get payment dashboard data   | ✅            | `ADMIN`       |
| `GET`  | `/payment-analytics/revenue`    | Get revenue breakdown        | ✅            | `ADMIN`       |
| `GET`  | `/payment-analytics/conversion` | Get payment conversion rates | ✅            | `ADMIN`       |
| `GET`  | `/payment-analytics/methods`    | Get payment method usage     | ✅            | `ADMIN`       |
| `GET`  | `/payment-analytics/providers`  | Get provider performance     | ✅            | `ADMIN`       |
| `GET`  | `/payment-analytics/refunds`    | Get refund analytics         | ✅            | `ADMIN`       |
| `GET`  | `/payment-analytics/export`     | Export payment data          | ✅            | `ADMIN`       |

---

## 🔔 Notifications (`/notifications`)

| Method   | Endpoint                          | Description                            | Auth Required | Role Required |
| -------- | --------------------------------- | -------------------------------------- | ------------- | ------------- |
| `POST`   | `/notifications/send`             | Send notification to specific user     | ✅            | `ADMIN`       |
| `POST`   | `/notifications/send-bulk`        | Send notification to multiple users    | ✅            | `ADMIN`       |
| `POST`   | `/notifications/send-to-role`     | Send notification to user role         | ✅            | `ADMIN`       |
| `POST`   | `/notifications/send-to-all`      | Send notification to all users         | ✅            | `ADMIN`       |
| `POST`   | `/notifications/send-to-property` | Send notification to property buyers   | ✅            | `ADMIN`       |
| `POST`   | `/notifications/send-to-project`  | Send notification to project followers | ✅            | `ADMIN`       |
| `GET`    | `/notifications`                  | Get user notifications (paginated)     | ✅            | -             |
| `GET`    | `/notifications/:id`              | Get notification details               | ✅            | -             |
| `PATCH`  | `/notifications/:id/read`         | Mark notification as read              | ✅            | -             |
| `PATCH`  | `/notifications/read-all`         | Mark all notifications as read         | ✅            | -             |
| `DELETE` | `/notifications/:id`              | Delete notification                    | ✅            | -             |
| `DELETE` | `/notifications/clear-all`        | Clear all user notifications           | ✅            | -             |
| `GET`    | `/notifications/unread-count`     | Get unread notification count          | ✅            | -             |
| `GET`    | `/notifications/sent`             | Get sent notifications (admin)         | ✅            | `ADMIN`       |
| `GET`    | `/notifications/analytics`        | Get notification analytics             | ✅            | `ADMIN`       |
| `POST`   | `/notifications/templates`        | Create notification template           | ✅            | `ADMIN`       |
| `GET`    | `/notifications/templates`        | Get notification templates             | ✅            | `ADMIN`       |
| `PATCH`  | `/notifications/templates/:id`    | Update notification template           | ✅            | `ADMIN`       |
| `DELETE` | `/notifications/templates/:id`    | Delete notification template           | ✅            | `ADMIN`       |
| `POST`   | `/notifications/test`             | Test notification delivery             | ✅            | `ADMIN`       |

---

## 📱 Push Notifications (`/push-notifications`)

| Method   | Endpoint                          | Description                            | Auth Required | Role Required |
| -------- | --------------------------------- | -------------------------------------- | ------------- | ------------- |
| `POST`   | `/push-notifications/register`    | Register device for push notifications | ✅            | -             |
| `DELETE` | `/push-notifications/unregister`  | Unregister device                      | ✅            | -             |
| `GET`    | `/push-notifications/devices`     | Get user's registered devices          | ✅            | -             |
| `PATCH`  | `/push-notifications/preferences` | Update notification preferences        | ✅            | -             |
| `GET`    | `/push-notifications/preferences` | Get notification preferences           | ✅            | -             |
| `POST`   | `/push-notifications/send`        | Send push notification                 | ✅            | `ADMIN`       |
| `POST`   | `/push-notifications/send-bulk`   | Send bulk push notifications           | ✅            | `ADMIN`       |
| `GET`    | `/push-notifications/analytics`   | Get push notification analytics        | ✅            | `ADMIN`       |

---

## ✅ Verification (`/verification`)

| Method | Endpoint                   | Description           | Auth Required |
| ------ | -------------------------- | --------------------- | ------------- |
| `POST` | `/verification/send-otp`   | Send verification OTP | ❌            |
| `POST` | `/verification/verify-otp` | Verify OTP            | ❌            |

---

## 👨‍💼 Admin (`/admin`)

| Method | Endpoint             | Description       | Auth Required | Role Required |
| ------ | -------------------- | ----------------- | ------------- | ------------- |
| `GET`  | `/admin/users/:role` | Get users by role | ✅            | `ADMIN`       |

---

## 🏠 Root (`/`)

| Method | Endpoint | Description  | Auth Required |
| ------ | -------- | ------------ | ------------- |
| `GET`  | `/`      | Health check | ❌            |

---

## 📊 Database Structure

The application uses **PostgreSQL** with **Prisma ORM** for database management. The schema is designed to support a comprehensive real estate platform with role-based user management, property listings, project management, and payment processing.

### 🗄️ Database Entities

#### 👤 User Entity

The core user entity with role-based profiles and authentication.

| Field          | Type       | Description            | Constraints            |
| -------------- | ---------- | ---------------------- | ---------------------- |
| `id`           | `String`   | Unique identifier      | `@id @default(uuid())` |
| `email`        | `String?`  | User email address     | `@unique`              |
| `phoneNumber`  | `String`   | Primary contact number | `@unique`              |
| `name`         | `String?`  | User's full name       | -                      |
| `profileImage` | `String?`  | Profile image URL      | -                      |
| `role`         | `Role`     | User role in system    | `@default(BUYER)`      |
| `createdAt`    | `DateTime` | Account creation date  | `@default(now())`      |
| `updatedAt`    | `DateTime` | Last update timestamp  | `@updatedAt`           |

**Relationships:**

- `Broker` - One-to-one with broker profile
- `Buyer` - One-to-one with buyer profile
- `Developer` - One-to-one with developer profile
- `Owner` - One-to-one with owner profile
- `payments` - One-to-many with payments
- `projects` - One-to-many with projects (as developer)
- `brokeredProperties` - One-to-many with properties (as broker)
- `ownedProperties` - One-to-many with properties (as owner)

#### 🏠 Property Entity

Real estate properties with detailed specifications and location data.

| Field                   | Type                   | Description             | Constraints            |
| ----------------------- | ---------------------- | ----------------------- | ---------------------- |
| `id`                    | `String`               | Unique identifier       | `@id @default(uuid())` |
| `title`                 | `String`               | Property title          | -                      |
| `description`           | `String`               | Detailed description    | -                      |
| `price`                 | `Decimal`              | Property price          | -                      |
| `currency`              | `String`               | Price currency          | -                      |
| `downPaymentPercentage` | `Int`                  | Required down payment % | -                      |
| `cashBackPercentage`    | `Int?`                 | Cash back percentage    | -                      |
| `city`                  | `String`               | Property city           | -                      |
| `address`               | `String`               | Full address            | -                      |
| `space`                 | `Int`                  | Property area (sqm)     | -                      |
| `numberOfLivingRooms`   | `Int`                  | Living room count       | -                      |
| `numberOfRooms`         | `Int`                  | Total room count        | -                      |
| `numberOfKitchen`       | `Int`                  | Kitchen count           | -                      |
| `numberOfWC`            | `Int`                  | Bathroom count          | -                      |
| `numberOfFloors`        | `Int`                  | Floor count             | -                      |
| `streetWidth`           | `Int`                  | Street width (meters)   | -                      |
| `age`                   | `Int`                  | Property age (years)    | -                      |
| `facing`                | `FacingDirection`      | Property orientation    | -                      |
| `type`                  | `PropertyType`         | Property type           | -                      |
| `category`              | `PropertyCategory`     | Property category       | -                      |
| `unitStatus`            | `UnitStatus`           | Availability status     | -                      |
| `infrastructureItems`   | `InfrastructureItem[]` | Available amenities     | -                      |
| `locationLat`           | `Float`                | Latitude coordinate     | -                      |
| `locationLng`           | `Float`                | Longitude coordinate    | -                      |
| `createdAt`             | `DateTime`             | Creation timestamp      | `@default(now())`      |
| `updatedAt`             | `DateTime`             | Update timestamp        | `@updatedAt`           |
| `ownerId`               | `String`               | Property owner ID       | Foreign key            |
| `brokerId`              | `String?`              | Broker ID               | Foreign key            |
| `projectId`             | `String?`              | Associated project ID   | Foreign key            |

**Relationships:**

- `owner` - Many-to-one with User (property owner)
- `broker` - Many-to-one with User (property broker)
- `project` - Many-to-one with Project
- `media` - One-to-many with Media

#### 🏢 Project Entity

Development projects containing multiple properties.

| Field                 | Type                   | Description         | Constraints            |
| --------------------- | ---------------------- | ------------------- | ---------------------- |
| `id`                  | `String`               | Unique identifier   | `@id @default(uuid())` |
| `developerId`         | `String`               | Developer user ID   | Foreign key            |
| `name`                | `String`               | Project name        | -                      |
| `description`         | `String`               | Project description | -                      |
| `city`                | `String`               | Project city        | -                      |
| `type`                | `PropertyType`         | Project type        | -                      |
| `category`            | `PropertyCategory`     | Project category    | -                      |
| `infrastructureItems` | `InfrastructureItem[]` | Project amenities   | -                      |
| `createdAt`           | `DateTime`             | Creation timestamp  | `@default(now())`      |
| `updatedAt`           | `DateTime`             | Update timestamp    | `@updatedAt`           |

**Relationships:**

- `developer` - Many-to-one with User (project developer)
- `properties` - One-to-many with Property
- `media` - One-to-many with Media
- `nearbyPlaces` - One-to-many with NearbyPlace

#### 📁 Media Entity

File attachments for properties and projects.

| Field        | Type        | Description            | Constraints            |
| ------------ | ----------- | ---------------------- | ---------------------- |
| `id`         | `String`    | Unique identifier      | `@id @default(uuid())` |
| `type`       | `MediaType` | Media type             | -                      |
| `url`        | `String`    | File URL               | -                      |
| `key`        | `String`    | Storage key            | -                      |
| `name`       | `String?`   | File name              | -                      |
| `propertyId` | `String?`   | Associated property ID | Foreign key            |
| `projectId`  | `String?`   | Associated project ID  | Foreign key            |
| `createdAt`  | `DateTime`  | Upload timestamp       | `@default(now())`      |

**Relationships:**

- `property` - Many-to-one with Property
- `project` - Many-to-one with Project

**Relationships:**

- `user` - Many-to-one with User

#### 📍 NearbyPlace Entity

Points of interest near projects.

| Field       | Type     | Description           | Constraints            |
| ----------- | -------- | --------------------- | ---------------------- |
| `id`        | `String` | Unique identifier     | `@id @default(uuid())` |
| `name`      | `String` | Place name            | -                      |
| `distance`  | `Float`  | Distance from project | -                      |
| `projectId` | `String` | Associated project ID | Foreign key            |

**Relationships:**

- `project` - Many-to-one with Project

#### 💳 Payment Entity

Payment transactions with multi-provider support and refund tracking.

| Field            | Type              | Description            | Constraints            |
| ---------------- | ----------------- | ---------------------- | ---------------------- |
| `id`             | `String`          | Unique identifier      | `@id @default(uuid())` |
| `userId`         | `String`          | User ID                | Foreign key            |
| `propertyId`     | `String`          | Property ID            | Foreign key            |
| `amount`         | `Decimal`         | Payment amount         | -                      |
| `currency`       | `String`          | Payment currency       | `@default("SAR")`      |
| `status`         | `PaymentStatus`   | Payment status         | `@default(pending)`    |
| `method`         | `PaymentMethod`   | Payment method         | `@default(card)`       |
| `provider`       | `PaymentProvider` | Payment provider       | -                      |
| `externalId`     | `String`          | Provider reference ID  | -                      |
| `reference`      | `String?`         | Internal tracking code | -                      |
| `rawPayload`     | `Json?`           | Provider response data | -                      |
| `refundedAmount` | `Decimal?`        | Total refunded amount  | -                      |
| `createdAt`      | `DateTime`        | Creation timestamp     | `@default(now())`      |
| `updatedAt`      | `DateTime`        | Update timestamp       | `@updatedAt`           |

**Relationships:**

- `user` - Many-to-one with User
- `property` - Many-to-one with Property
- `refunds` - One-to-many with Refund

#### 🔁 Refund Entity

Refund records linked to payments.

| Field        | Type       | Description        | Constraints            |
| ------------ | ---------- | ------------------ | ---------------------- |
| `id`         | `String`   | Unique identifier  | `@id @default(uuid())` |
| `paymentId`  | `String`   | Payment ID         | Foreign key            |
| `amount`     | `Decimal`  | Refund amount      | -                      |
| `reason`     | `String?`  | Refund reason      | -                      |
| `externalId` | `String?`  | Provider refund ID | -                      |
| `createdAt`  | `DateTime` | Refund timestamp   | `@default(now())`      |

**Relationships:**

- `payment` - Many-to-one with Payment

#### ⏳ Reservation Entity

Property reservations with automatic expiration.

| Field        | Type       | Description        | Constraints            |
| ------------ | ---------- | ------------------ | ---------------------- |
| `id`         | `String`   | Unique identifier  | `@id @default(uuid())` |
| `userId`     | `String`   | User ID            | Foreign key            |
| `propertyId` | `String`   | Property ID        | Foreign key            |
| `expiresAt`  | `DateTime` | Reservation expiry | -                      |

**Relationships:**

- `user` - Many-to-one with User
- `property` - Many-to-one with Property

#### 🔔 Notification Entity

In-app notifications stored in database.

| Field         | Type                   | Description                  | Constraints            |
| ------------- | ---------------------- | ---------------------------- | ---------------------- |
| `id`          | `String`               | Unique identifier            | `@id @default(uuid())` |
| `userId`      | `String`               | Target user ID               | Foreign key            |
| `title`       | `String`               | Notification title           | -                      |
| `message`     | `String`               | Notification message         | -                      |
| `type`        | `NotificationType`     | Notification type            | -                      |
| `priority`    | `NotificationPriority` | Notification priority        | `@default(normal)`     |
| `isRead`      | `Boolean`              | Read status                  | `@default(false)`      |
| `data`        | `Json?`                | Additional notification data | -                      |
| `scheduledAt` | `DateTime?`            | Scheduled delivery time      | -                      |
| `sentAt`      | `DateTime?`            | Actual sent time             | -                      |
| `readAt`      | `DateTime?`            | Read timestamp               | -                      |
| `createdAt`   | `DateTime`             | Creation timestamp           | `@default(now())`      |

**Relationships:**

- `user` - Many-to-one with User

#### 📱 Push Notification Device Entity

Device registration for push notifications.

| Field         | Type             | Description             | Constraints            |
| ------------- | ---------------- | ----------------------- | ---------------------- |
| `id`          | `String`         | Unique identifier       | `@id @default(uuid())` |
| `userId`      | `String`         | User ID                 | Foreign key            |
| `deviceToken` | `String`         | FCM device token        | `@unique`              |
| `platform`    | `DevicePlatform` | Device platform         | -                      |
| `appVersion`  | `String?`        | App version             | -                      |
| `isActive`    | `Boolean`        | Device active status    | `@default(true)`       |
| `lastSeen`    | `DateTime`       | Last activity timestamp | `@default(now())`      |
| `createdAt`   | `DateTime`       | Registration timestamp  | `@default(now())`      |

**Relationships:**

- `user` - Many-to-one with User

#### 📋 Notification Template Entity

Pre-defined notification templates.

| Field       | Type               | Description            | Constraints            |
| ----------- | ------------------ | ---------------------- | ---------------------- |
| `id`        | `String`           | Unique identifier      | `@id @default(uuid())` |
| `name`      | `String`           | Template name          | -                      |
| `title`     | `String`           | Template title         | -                      |
| `message`   | `String`           | Template message       | -                      |
| `type`      | `NotificationType` | Template type          | -                      |
| `variables` | `String[]`         | Template variables     | -                      |
| `isActive`  | `Boolean`          | Template active status | `@default(true)`       |
| `createdAt` | `DateTime`         | Creation timestamp     | `@default(now())`      |
| `updatedAt` | `DateTime`         | Update timestamp       | `@updatedAt`           |

### 👥 Role-Based Profile Entities

#### 🏠 Buyer Profile

| Field      | Type      | Description        | Constraints                            |
| ---------- | --------- | ------------------ | -------------------------------------- |
| `id`       | `String`  | User ID reference  | `@id @default(uuid()) @map("user_id")` |
| `name`     | `String?` | Buyer's first name | -                                      |
| `lastName` | `String?` | Buyer's last name  | -                                      |

#### 🏗️ Developer Profile

| Field          | Type      | Description               | Constraints                            |
| -------------- | --------- | ------------------------- | -------------------------------------- |
| `id`           | `String`  | User ID reference         | `@id @default(uuid()) @map("user_id")` |
| `hasWafi`      | `Boolean` | Wafi certification        | -                                      |
| `acceptsBanks` | `Boolean` | Bank financing acceptance | -                                      |

#### 🏢 Owner Profile

| Field | Type     | Description       | Constraints                            |
| ----- | -------- | ----------------- | -------------------------------------- |
| `id`  | `String` | User ID reference | `@id @default(uuid()) @map("user_id")` |

#### 🏠 Broker Profile

| Field           | Type     | Description       | Constraints                            |
| --------------- | -------- | ----------------- | -------------------------------------- |
| `id`            | `String` | User ID reference | `@id @default(uuid()) @map("user_id")` |
| `licenseNumber` | `String` | License number    | -                                      |

### 📋 Enums

#### 👤 User Roles (`Role`)

- `BUYER` - Property buyers
- `DEVELOPER` - Real estate developers
- `OWNER` - Property owners
- `BROKER` - Real estate brokers
- `ADMIN` - System administrators

#### 🏠 Property Types (`PropertyType`)

- `residential` - Residential properties
- `commercial` - Commercial properties

#### 🏠 Property Categories (`PropertyCategory`)

- `palace` - Palace properties
- `villa` - Villa properties
- `duplex` - Duplex properties
- `singleStoryHouse` - Single story houses
- `apartment` - Apartment units
- `land` - Land plots

#### 🏠 Unit Status (`UnitStatus`)

- `available` - Available for purchase
- `sold` - Already sold
- `reserved` - Reserved/pending
- `rented` - Currently rented

#### 📁 Media Types (`MediaType`)

- `video` - Video files
- `virtualTour` - Virtual tour files
- `threeD` - 3D model files
- `photo` - Image files
- `document` - PDF documents

#### 🏗️ Infrastructure Items (`InfrastructureItem`)

- `waterNetwork` - Water supply
- `sewageSystem` - Sewage system
- `electricityNetwork` - Electrical grid
- `fiberOptics` - Fiber optic internet
- `parking` - Parking facilities
- `elevator` - Elevator access
- `fiberOpticExtension` - Extended fiber optics
- `basement` - Basement available
- `insulationBlock` - Insulation system
- `pool` - Swimming pool
- `playground` - Playground area

#### 🧭 Facing Direction (`FacingDirection`)

- `north` - North facing
- `south` - South facing
- `east` - East facing
- `west` - West facing
- `northEast` - Northeast facing
- `northWest` - Northwest facing
- `southEast` - Southeast facing
- `southWest` - Southwest facing

#### 💳 Payment Status (`PaymentStatus`)

- `pending` - Payment created but not completed
- `succeeded` - Payment completed successfully
- `failed` - Payment failed
- `canceled` - Canceled by user or provider
- `expired` - Session timed out or expired
- `refunded` - Fully refunded
- `partial_refund` - Partially refunded

#### 💳 Payment Method (`PaymentMethod`)

- `card` - Credit/debit card payments
- `bank` - Bank transfer payments
- `wallet` - Digital wallet payments
- `applePay` - Apple Pay payments

#### 💳 Payment Provider (`PaymentProvider`)

- `checkout` - Checkout.com integration
- `stripe` - Stripe integration
- `tap` - Tap Payments integration
- `manual` - Admin/manual entries

#### 🔔 Notification Type (`NotificationType`)

- `info` - General information notifications
- `success` - Success/confirmation notifications
- `warning` - Warning notifications
- `error` - Error notifications
- `payment` - Payment-related notifications
- `property` - Property-related notifications
- `project` - Project-related notifications
- `promotional` - Promotional/marketing notifications
- `system` - System maintenance notifications

#### 🔔 Notification Priority (`NotificationPriority`)

- `low` - Low priority notifications
- `normal` - Standard priority notifications
- `high` - High priority notifications
- `urgent` - Urgent notifications

#### 📱 Device Platform (`DevicePlatform`)

- `ios` - iOS devices
- `android` - Android devices
- `web` - Web browsers
- `flutter` - Flutter apps

### 🔗 Database Relationships

```
User (1) ←→ (1) Buyer/Developer/Owner/Broker
User (1) ←→ (N) Payment
User (1) ←→ (N) Reservation
User (1) ←→ (N) Notification
User (1) ←→ (N) PushNotificationDevice
User (1) ←→ (N) Project (as developer)
User (1) ←→ (N) Property (as owner)
User (1) ←→ (N) Property (as broker)

Project (1) ←→ (N) Property
Project (1) ←→ (N) Media
Project (1) ←→ (N) NearbyPlace

Property (1) ←→ (N) Media
Property (1) ←→ (N) Payment
Property (1) ←→ (N) Reservation
Property (N) ←→ (1) User (owner)
Property (N) ←→ (1) User (broker)
Property (N) ←→ (1) Project

Payment (1) ←→ (N) Refund
Payment (N) ←→ (1) User
Payment (N) ←→ (1) Property

Notification (N) ←→ (1) User
PushNotificationDevice (N) ←→ (1) User
```

### 📊 Database Indexes

- **User**: `phoneNumber` (for fast phone-based lookups)
- **Property**: `locationLat, locationLng` (for geospatial queries)
- **Media**: `propertyId`, `projectId` (for efficient media retrieval)
- **NearbyPlace**: `projectId` (for project-specific places)
- **Payment**: `userId`, `propertyId`, `externalId` (for payment lookups)
- **Payment**: `userId, propertyId, status` (unique constraint for pending payments)
- **Notification**: `userId`, `isRead`, `createdAt` (for notification queries)
- **PushNotificationDevice**: `userId`, `deviceToken`, `isActive` (for device management)
- **NotificationTemplate**: `isActive` (for active templates)

### 🔒 Database Constraints

- **Unique Constraints**: Email, phone number, payment external ID, pending payment per user/property
- **Foreign Key Constraints**: All relationship fields maintain referential integrity
- **Cascade Deletes**: Media files are deleted when properties/projects are removed
- **Required Fields**: Essential fields like phone numbers and prices are non-nullable
- **Payment Constraints**: One pending payment per user per property

---

## 📝 Notes

### Media Types (`MediaType`)

- `photo` - Images
- `video` - Video files
- `virtualTour` - Virtual tour files
- `threeD` - 3D model files
- `document` - PDF documents

### User Roles (`Role`)

- `BUYER` - Property buyers
- `OWNER` - Property owners
- `DEVELOPER` - Real estate developers
- `BROKER` - Real estate brokers
- `ADMIN` - System administrators

### Authentication

- Most endpoints require JWT authentication
- Admin endpoints require both JWT auth and `ADMIN` role
- Public endpoints: health check, property listing, verification

### File Upload

- Media upload endpoints accept up to 10 files
- Profile image upload accepts single file
- Documents are restricted to PDF files only

### Payment System

#### Payment Flow

1. **Reservation** - User reserves property (optional, time-limited)
2. **Payment Creation** - Create payment session with provider
3. **Payment Processing** - User completes payment via provider
4. **Webhook Handling** - Provider notifies system of payment status
5. **Status Update** - System updates payment and property status
6. **Refund Processing** - Handle refunds if needed

#### Payment Providers

- **Checkout.com** - Primary payment processor
- **Other..** - Alternative payment processor

#### Payment Methods

- **Card** - Credit/debit card payments
- **Bank** - Bank transfer payments
- **Wallet** - Digital wallet payments (Apple Pay, Google Pay)
- **Apple Pay** - Direct Apple Pay integration

#### Payment Statuses

- **pending** - Payment initiated, awaiting completion
- **succeeded** - Payment completed successfully
- **failed** - Payment failed or declined
- **canceled** - Payment canceled by user or system
- **expired** - Payment session expired
- **refunded** - Payment fully refunded
- **partial_refund** - Payment partially refunded

#### Reservation System

- **Time-limited** - Reservations expire automatically
- **Convertible** - Reservations can be converted to payments
- **Extendable** - Users can extend reservation time
- **Cleanup** - Expired reservations are automatically cleaned up

#### Refund System

- **Full Refunds** - Complete payment refund
- **Partial Refunds** - Partial payment refund
- **Approval Workflow** - Admin approval for refunds
- **Provider Integration** - Automatic refund processing

#### Analytics & Reporting

- **Revenue Tracking** - Real-time revenue analytics
- **Conversion Rates** - Payment success rates
- **Provider Performance** - Payment provider metrics
- **Refund Analytics** - Refund patterns and reasons
- **Export Capabilities** - Data export for accounting

### Notification System

#### Firebase Integration

The notification system uses **Firebase Cloud Messaging (FCM)** for reliable push notification delivery across all platforms:

- **Firebase Admin SDK** - Server-side notification sending
- **FCM Tokens** - Device-specific notification targeting
- **Topic Subscriptions** - Group-based notifications
- **Cross-Platform Support** - iOS, Android, and Web notifications

#### Notification Types

- **In-App Notifications** - Stored in database, displayed in app
- **Push Notifications** - Real-time device notifications
- **Email Notifications** - Email-based notifications (optional)
- **SMS Notifications** - Text message notifications (optional)

#### Notification Targeting

- **Individual Users** - Send to specific user by ID
- **User Roles** - Send to all users with specific role (BUYER, DEVELOPER, etc.)
- **Property Buyers** - Send to users interested in specific property
- **Project Followers** - Send to users following specific project
- **Geographic Targeting** - Send to users in specific cities
- **Bulk Notifications** - Send to multiple users simultaneously
- **Broadcast** - Send to all users in the system

#### Notification Features

- **Templates** - Pre-defined notification templates for common messages
- **Scheduling** - Schedule notifications for future delivery
- **Read Status** - Track notification read/unread status
- **Analytics** - Notification delivery and engagement metrics
- **Preferences** - User-configurable notification preferences
- **Rich Content** - Support for images, links, and custom data

#### Admin Capabilities

- **Custom Messages** - Send personalized notifications
- **Bulk Operations** - Send to multiple users at once
- **Template Management** - Create and manage notification templates
- **Analytics Dashboard** - Monitor notification performance
- **Testing Tools** - Test notification delivery
- **Delivery Reports** - Track notification delivery status

### Pagination

Most list endpoints support pagination with query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Filtering

Many endpoints support filtering with query parameters:

- `search` - Text search
- `type` - Property/Project type
- `category` - Property/Project category
- `city` - Location filter
- `sortBy` - Sort field
- `sortOrder` - Sort direction (asc/desc)
