# 🏠 Ousol Real Estate API Documentation

**Base URL:** `http://localhost:3000/api/v1`

## 📋 Table of Contents

- [Authentication](#-authentication-auth)
- [User Management](#-user-management-user)
- [Users Management](#-users-management-users---admin-only)
- [Projects](#-projects-projects)
- [Properties](#-properties-properties)
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

| Method   | Endpoint                           | Description                | Auth Required |
| -------- | ---------------------------------- | -------------------------- | ------------- |
| `GET`    | `/user/me`                         | Get current user profile   | ✅            |
| `POST`   | `/user/complete-profile/buyer`     | Complete buyer profile     | ✅            |
| `POST`   | `/user/complete-profile/owner`     | Complete owner profile     | ✅            |
| `POST`   | `/user/complete-profile/developer` | Complete developer profile | ✅            |
| `POST`   | `/user/complete-profile/broker`    | Complete broker profile    | ✅            |
| `POST`   | `/user/profile-image`              | Upload profile image       | ✅            |
| `GET`    | `/user/profile-image`              | Get profile image          | ✅            |
| `DELETE` | `/user/profile-image`              | Delete profile image       | ✅            |

---

## 👥 Users Management (`/users`) - Admin Only

| Method | Endpoint                | Description               | Auth Required | Role Required |
| ------ | ----------------------- | ------------------------- | ------------- | ------------- |
| `GET`  | `/users`                | Get all users (paginated) | ✅            | `ADMIN`       |
| `GET`  | `/users/:id`            | Get user by ID            | ✅            | `ADMIN`       |
| `GET`  | `/users/developers`     | Get all developers        | ✅            | Any           |
| `GET`  | `/users/brokers`        | Get all brokers           | ✅            | Any           |
| `GET`  | `/users/developers/:id` | Get developer by ID       | ✅            | Any           |
| `GET`  | `/users/brokers/:id`    | Get broker by ID          | ✅            | Any           |

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
| `isLicensed`   | `Boolean` | Developer license status  | -                                      |
| `hasWafi`      | `Boolean` | Wafi certification        | -                                      |
| `acceptsBanks` | `Boolean` | Bank financing acceptance | -                                      |
| `companyName`  | `String?` | Company name              | -                                      |

#### 🏢 Owner Profile

| Field         | Type      | Description       | Constraints                            |
| ------------- | --------- | ----------------- | -------------------------------------- |
| `id`          | `String`  | User ID reference | `@id @default(uuid()) @map("user_id")` |
| `companyName` | `String?` | Company name      | -                                      |

#### 🏠 Broker Profile

| Field           | Type      | Description           | Constraints                            |
| --------------- | --------- | --------------------- | -------------------------------------- |
| `id`            | `String`  | User ID reference     | `@id @default(uuid()) @map("user_id")` |
| `isLicensed`    | `Boolean` | Broker license status | -                                      |
| `licenseNumber` | `String`  | License number        | -                                      |

### 📋 Enums

#### 👤 User Roles (`Role`)

- `BUYER` - Property buyers
- `DEVELOPER` - Real estate developers
- `OWNER` - Property owners
- `BROKER` - Real estate brokers
- `ADMIN` - System administrators

#### 💳 Payment Status (`PaymentStatus`)

- `PENDING` - Payment initiated
- `SUCCEEDED` - Payment completed
- `FAILED` - Payment failed

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

### 🔗 Database Relationships

```
User (1) ←→ (1) Buyer/Developer/Owner/Broker
User (1) ←→ (N) Payment
User (1) ←→ (N) Project (as developer)
User (1) ←→ (N) Property (as owner)
User (1) ←→ (N) Property (as broker)

Project (1) ←→ (N) Property
Project (1) ←→ (N) Media
Project (1) ←→ (N) NearbyPlace

Property (1) ←→ (N) Media
Property (N) ←→ (1) User (owner)
Property (N) ←→ (1) User (broker)
Property (N) ←→ (1) Project
```

### 📊 Database Indexes

- **User**: `phoneNumber` (for fast phone-based lookups)
- **Property**: `locationLat, locationLng` (for geospatial queries)
- **Media**: `propertyId`, `projectId` (for efficient media retrieval)
- **NearbyPlace**: `projectId` (for project-specific places)

### 🔒 Database Constraints

- **Foreign Key Constraints**: All relationship fields maintain referential integrity
- **Cascade Deletes**: Media files are deleted when properties/projects are removed
- **Required Fields**: Essential fields like phone numbers and prices are non-nullable

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
