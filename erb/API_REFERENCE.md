# ERB System — API Reference Manual

This document provides the complete API Reference for the **ERB** backend engine. Use this manual to integrate Frontend/Dashboard systems with the API.

---

## General Configuration

- **Base URL**: `http://localhost:5000/api/v1`
- **Authorization Header**: 
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Standard Response Envelope (Success)**:
  ```json
  {
    "meta": {
      "status": 200,
      "success": true,
      "message": "Operation successful"
    },
    "data": { ... }
  }
  ```
- **Standard Response Envelope (Error)**:
  ```json
  {
    "meta": {
      "status": 400,
      "success": false,
      "message": "Invalid input provided"
    }
  }
  ```

### Common Query Parameters (GET Lists)
All GET list endpoints support the following query parameters:
- `page` (integer, default: `1`): Page number.
- `limit` (integer, default: `20`): Page size limit.
- `sort` (string, optional): Order formatting. Sort by `date` (equivalent to `createdAt DESC`), `name` (equivalent to `name ASC`), or comma-separated field names (e.g. `job_title,status`).
- `fields` (string, optional): Comma-separated fields to **exclude** from response (e.g., `fields=password,notes`).
- `keyword` (string, optional): Search query matched against the module's search fields.
- `[field]` (optional): Equality filters (e.g., `status=active`).
- `[field][gte/lte/gt/lt]` (optional): Range filters (e.g., `amount[gte]=5000`).

---

## Table of Contents

| Module | Endpoint Count | Link |
|---|:---:|---|
| **System Endpoints** | 2 | [#system-endpoints](#system-endpoints) |
| **1. Users** | 5 | [#1-users](#1-users) |
| **2. Auth** | 5 | [#2-auth](#2-auth) |
| **3. Departments** | 5 | [#3-departments](#3-departments) |
| **4. Shifts** | 5 | [#4-shifts](#4-shifts) |
| **5. Leave Types** | 5 | [#5-leave-types](#5-leave-types) |
| **6. Official Holidays** | 5 | [#6-official-holidays](#6-official-holidays) |
| **7. Accounts** | 5 | [#7-accounts](#7-accounts) |
| **8. Allowance Types** | 5 | [#8-allowance-types](#8-allowance-types) |
| **9. Absence Types** | 5 | [#9-absence-types](#9-absence-types) |
| **10. Bonus Types** | 5 | [#10-bonus-types](#10-bonus-types) |
| **11. Insurance Settings** | 5 | [#11-insurance-settings](#11-insurance-settings) |
| **12. Employees** | 5 | [#12-employees](#12-employees) |
| **13. Employee Documents** | 5 | [#13-employee-documents](#13-employee-documents) |
| **14. Employee Relatives** | 5 | [#14-employee-relatives](#14-employee-relatives) |
| **15. Employee Experience** | 5 | [#15-employee-experience](#15-employee-experience) |
| **16. Contracts** | 5 | [#16-contracts](#16-contracts) |
| **17. Contract Allowances** | 5 | [#17-contract-allowances](#17-contract-allowances) |
| **18. Contract Leaves** | 5 | [#18-contract-leaves](#18-contract-leaves) |
| **19. Custody** | 5 | [#19-custody](#19-custody) |
| **20. Employee Loans** | 5 | [#20-employee-loans](#20-employee-loans) |
| **21. Employee Bonuses** | 5 | [#21-employee-bonuses](#21-employee-bonuses) |
| **22. Absences** | 5 | [#22-absences](#22-absences) |
| **23. Leave Requests** | 5 | [#23-leave-requests](#23-leave-requests) |
| **24. Attendance** | 5 | [#24-attendance](#24-attendance) |
| **25. Payroll Runs** | 6 | [#25-payroll-runs](#25-payroll-runs) |
| **26. Payroll Details** | 2 | [#26-payroll-details](#26-payroll-details) |
| **27. Reports** | 5 | [#27-reports](#27-reports) |

---

## System Endpoints

### `GET /`
- **Description**: Basic root entry point checking server status.
- **Authentication**: None ⚠️
- **Authorization**: Public
- **Response Shape (Success)**: Text response: `Express + TypeScript Server`
- **Response Shape (Error)**: 500 (Server Error)
- **Example**:
  - Request: `GET /`
  - Response (200): `Express + TypeScript Server`

### `GET /health`
- **Description**: Health status check for server and database connectivity.
- **Authentication**: None ⚠️
- **Authorization**: Public
- **Response Shape (Success)**:
  - `status` (string): Current server status (`"UP"`)
  - `timestamp` (string): ISO timestamp of current time
  - `database` (string): Connectivity status (`"CONNECTED"`)
- **Response Shape (Error)**: 500 (Database/Server Disconnected)
- **Example**:
  - Request: `GET /health`
  - Response (200):
    ```json
    {
      "status": "UP",
      "timestamp": "2026-06-18T14:18:34.000Z",
      "database": "CONNECTED"
    }
    ```

---

## 1. Users

### `POST /api/v1/user`
- **Description**: Registers a new dashboard user account.
- **Authentication**: Bearer Token
- **Authorization**: `SUPER-ADMIN`, `ADMIN`
- **Request Body**:
  - `name` (string, required): Full name of the user, min 3 characters, max 100 characters.
  - `email` (string, required): Valid professional email matching `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov)$`.
  - `phoneNumber` (string, required): Egyptian mobile number matching `/^01[0-2,5]{1}[0-9]{8}$/`.
  - `role` (string, optional, default: `"HR"`): User privilege level. Enum values: `"SUPER-ADMIN"`, `"ADMIN"`, `"HR"`, `"ACCOUNTING"`.
- **Response Shape (Success)**:
  - A JSON object representing the newly created user:
    ```json
    {
      "meta": {
        "status": 201,
        "success": true,
        "message": "User created successfully"
      },
      "data": {
        "id": 15,
        "name": "محمود علي عبد الرحمن",
        "email": "mahmoud.ali@company.com",
        "phoneNumber": "01012345678",
        "role": "HR",
        "uniqueCode": 482931,
        "isActive": true,
        "isBlock": false,
        "is_deleted": false,
        "confirmEmail": false,
        "updatedAt": "2026-06-18T11:22:42.000Z",
        "createdAt": "2026-06-18T11:22:42.000Z"
      }
    }
    ```
- **Response Shape (Error)**:
  - 400: Validation error (e.g., weak password, incorrect email pattern).
  - 401: Unauthorized (token missing or invalid).
  - 403: Forbidden (insufficient roles).
- **Example**:
  - Request Body:
    ```json
    {
      "name": "محمود علي عبد الرحمن",
      "email": "mahmoud.ali@company.com",
      "phoneNumber": "01012345678",
      "role": "HR"
    }
    ```
  - Response: (See response shape above)

### `GET /api/v1/user`
- **Description**: Retrieve a list of users.
- **Authentication**: Bearer Token
- **Authorization**: `SUPER-ADMIN`, `ADMIN`
- **Query Params**:
  - Supports standard query parameters: `page`, `limit`, `sort`, `fields`, `keyword`.
  - Keyword searches: `name`, `email`, `phoneNumber`, `uniqueCode`.
- **Response Shape (Success)**:
  - An array of user objects with pagination metadata.
- **Example**:
  - Request: `GET /api/v1/user?page=1&limit=2`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Users fetched successfully",
        "pagination": {
          "page": 1,
          "limit": 2,
          "totalItems": 10,
          "totalPages": 5
        }
      },
      "data": [
        {
          "id": 1,
          "name": "أحمد حسام",
          "email": "ahmed.hossam@company.com",
          "phoneNumber": "01123456789",
          "role": "SUPER-ADMIN",
          "isActive": true,
          "isBlock": false,
          "is_deleted": false
        },
        {
          "id": 2,
          "name": "محمد السيد",
          "email": "mohamed.elsayed@company.com",
          "phoneNumber": "01234567890",
          "role": "ADMIN",
          "isActive": true,
          "isBlock": false,
          "is_deleted": false
        }
      ]
    }
    ```

### `GET /api/v1/user/:id`
- **Description**: Retrieve detailed information for a single user by ID, including their department.
- **Authentication**: Bearer Token
- **Authorization**: `SUPER-ADMIN`, `ADMIN`
- **Path Params**:
  - `id` (number, required): Integer ID of the user.
- **Response Shape (Success)**:
  - User details object with associated departments.
- **Example**:
  - Request: `GET /api/v1/user/2`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "User fetched successfully"
      },
      "data": {
        "id": 2,
        "name": "محمد السيد",
        "email": "mohamed.elsayed@company.com",
        "phoneNumber": "01234567890",
        "role": "ADMIN",
        "isActive": true,
        "isBlock": false,
        "is_deleted": false,
        "departments": []
      }
    }
    ```

### `PATCH /api/v1/user/:id`
- **Description**: Update user settings and status.
- **Authentication**: Bearer Token
- **Authorization**: `SUPER-ADMIN`, `ADMIN`
- **Path Params**:
  - `id` (number, required): Integer ID of the user.
- **Request Body**:
  - `name` (string, optional): Min 3, max 100 characters.
  - `email` (string, optional): Valid professional email format.
  - `phoneNumber` (string, optional): Egyptian mobile number.
  - `role` (string, optional): Privileges (Enum: `"ADMIN"`, `"HR"`, `"ACCOUNTING"`). Note: `SUPER-ADMIN` cannot be assigned via update schema.
  - `isActive` (boolean, optional): Active state.
  - `isBlock` (boolean, optional): Block status.
- **Response Shape (Success)**:
  - Updated user object.
- **Example**:
  - Request: `PATCH /api/v1/user/2`
  - Request Body:
    ```json
    {
      "role": "ACCOUNTING",
      "isActive": true
    }
    ```
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "User updated successfully"
      },
      "data": {
        "id": 2,
        "name": "محمد السيد",
        "email": "mohamed.elsayed@company.com",
        "phoneNumber": "01234567890",
        "role": "ACCOUNTING",
        "isActive": true,
        "isBlock": false,
        "is_deleted": false
      }
    }
    ```

### `DELETE /api/v1/user/:id`
- **Description**: Soft delete a user or toggle their deletion status (`is_deleted` and `isActive`).
- **Authentication**: Bearer Token
- **Authorization**: `SUPER-ADMIN`, `ADMIN`
- **Path Params**:
  - `id` (number, required): Integer ID of the user.
- **Response Shape (Success)**:
  - Returns the user object with toggled status.
- **Example**:
  - Request: `DELETE /api/v1/user/2`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "User deleted successfully"
      },
      "data": {
        "id": 2,
        "name": "محمد السيد",
        "email": "mohamed.elsayed@company.com",
        "role": "ACCOUNTING",
        "isActive": false,
        "is_deleted": true
      }
    }
    ```

---

## 2. Auth

### `POST /api/v1/auth/login`
- **Description**: Log in with credentials and obtain a JWT bearer token.
- **Authentication**: None ⚠️
- **Authorization**: Public
- **Request Body**:
  - `identifier` (string, required): User email address or mobile number.
  - `password` (string, required): Password, min 6 characters.
- **Response Shape (Success)**:
  - `token` (string): Bearer JWT.
  - `user` (object): User details summary (id, name, role).
- **Example**:
  - Request Body:
    ```json
    {
      "identifier": "ahmed.hossam@company.com",
      "password": "Password123"
    }
    ```
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Logged in successfully"
      },
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJTVVBFUi1BRE1JTiIsIm5hbWUiOiLؤitNmZCBtZyJ9...",
        "user": {
          "id": 1,
          "name": "أحمد حسام",
          "role": "SUPER-ADMIN"
        }
      }
    }
    ```

### `POST /api/v1/auth/forgetPassword`
- **Description**: Initiates reset flow by sending a 6-digit verification code to the email address.
- **Authentication**: None ⚠️
- **Authorization**: Public
- **Request Body**:
  - `email` (string, required): Valid user email address.
- **Response Shape (Success)**:
  ```json
  {
    "meta": {
      "status": 200,
      "success": true,
      "message": "Reset code sent to email"
    },
    "data": null
  }
  ```
- **Example**:
  - Request Body:
    ```json
    {
      "email": "ahmed.hossam@company.com"
    }
    ```
  - Response (200): (See response shape above)

### `POST /api/v1/auth/verifyResetCode`
- **Description**: Validates the 6-digit numeric recovery code sent via email.
- **Authentication**: None ⚠️
- **Authorization**: Public
- **Request Body**:
  - `code` (string, required): Numeric code of exactly 6 digits matching `/^\d+$/`.
- **Response Shape (Success)**:
  ```json
  {
    "meta": {
      "status": 200,
      "success": true,
      "message": "Code verified successfully"
    },
    "data": null
  }
  ```
- **Example**:
  - Request Body:
    ```json
    {
      "code": "384915"
    }
    ```
  - Response (200): (See response shape above)

### `PATCH /api/v1/auth/resetPassword`
- **Description**: Complete password recovery using verified email and new password credentials.
- **Authentication**: None ⚠️
- **Authorization**: Public
- **Request Body**:
  - `email` (string, required): User email address.
  - `newPassword` (string, required): Min 6 characters.
- **Response Shape (Success)**:
  - Generates a new JWT and returns user details.
- **Example**:
  - Request Body:
    ```json
    {
      "email": "ahmed.hossam@company.com",
      "newPassword": "NewSecurePassword456"
    }
    ```
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Password reset successfully"
      },
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 1,
          "name": "أحمد حسام",
          "role": "SUPER-ADMIN"
        }
      }
    }
    ```

### `PATCH /api/v1/auth/changePassword`
- **Description**: Authenticated user updates their password.
- **Authentication**: Bearer Token
- **Authorization**: Any authenticated role
- **Request Body**:
  - `password` (string, required): Existing password.
  - `newPassword` (string, required): New password, min 6 characters.
- **Response Shape (Success)**:
  - Refreshed token and user summary.
- **Example**:
  - Request Body:
    ```json
    {
      "password": "Password123",
      "newPassword": "NewBetterPassword789"
    }
    ```
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Password changed successfully"
      },
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 1,
          "name": "أحمد حسام",
          "role": "SUPER-ADMIN"
        }
      }
    }
    ```

---

## 3. Departments

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/department`
- **Description**: Add a new operational department to organizational chart.
- **Request Body**:
  - `name` (string, required): Department name, min 2, max 100 characters.
  - `parent_id` (number, optional): Reference ID of parent department, allows `null`.
  - `type` (string, required): Classification or tier of the department (e.g. `"division"`, `"section"`).
- **Response Shape (Success)**:
  - Details of created department.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "قسم الموارد البشرية",
      "parent_id": null,
      "type": "main"
    }
    ```
  - Response (201):
    ```json
    {
      "meta": {
        "status": 201,
        "success": true,
        "message": "Department created successfully"
      },
      "data": {
        "id": 4,
        "name": "قسم الموارد البشرية",
        "parent_id": null,
        "type": "main",
        "isActive": true,
        "is_deleted": false
      }
    }
    ```

### `GET /api/v1/department`
- **Description**: List departments. Supports query criteria.
- **Query Params**:
  - Keyword search on fields: `name`, `type`.
- **Response Shape (Success)**: Array of departments.
- **Example**:
  - Request: `GET /api/v1/department?keyword=الموارد`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "success get all department"
      },
      "data": [
        {
          "id": 4,
          "name": "قسم الموارد البشرية",
          "parent_id": null,
          "type": "main",
          "isActive": true
        }
      ]
    }
    ```

### `GET /api/v1/department/:id`
- **Description**: Single department profile.
- **Path Params**:
  - `id` (number, required): Department ID.
- **Response Shape (Success)**: Single department object.

### `PATCH /api/v1/department/:id`
- **Description**: Update operational details or parent assignment of a department.
- **Path Params**:
  - `id` (number, required): Department ID.
- **Request Body**:
  - `name` (string, optional): Min 2, max 100.
  - `parent_id` (number, optional): Parent ID, allows `null`.
  - `type` (string, optional).
  - `isActive` (boolean, optional).
- **Response Shape (Success)**: Updated department model.

### `DELETE /api/v1/department/:id`
- **Description**: Soft deletes a department and recursively soft-deletes its sub-departments.
- **Path Params**:
  - `id` (number, required): Department ID.
- **Response Shape (Success)**: Toggled department record.

---

## 4. Shifts

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/shift`
- **Description**: Defines work timings, schedules, and grace periods.
- **Request Body**:
  - `name` (string, required): Shift label (e.g. `"الوردية الصباحية"`), min 2, max 100.
  - `type` (string, required): Enum: `"morning"`, `"evening"`, `"between"`.
  - `work_days` (array of strings, required): Workday codes. Allowed array items: `"sat"`, `"sun"`, `"mon"`, `"tue"`, `"wed"`, `"thu"`, `"fri"`.
  - `start_time` (string, required): Format `HH:MM` (e.g., `"08:30"`).
  - `end_time` (string, required): Format `HH:MM` (e.g., `"16:30"`).
  - `grace_minutes` (number, required): Buffer before late penalties apply, min 0.
  - `deduct_grace` (boolean, required): Flag indicating if grace is deducted.
  - `salary_basis_days` (number, required): Minimum working days for salary baseline, min 0.
- **Response Shape (Success)**: Shift detail.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "وردية العمل العادية",
      "type": "morning",
      "work_days": ["sun", "mon", "tue", "wed", "thu"],
      "start_time": "09:00",
      "end_time": "17:00",
      "grace_minutes": 15,
      "deduct_grace": true,
      "salary_basis_days": 26
    }
    ```

### `GET /api/v1/shift`
- **Description**: Retrieve active shifts.
- **Query Params**:
  - Keyword search on fields: `name`, `type`.

### `GET /api/v1/shift/:id`
- **Description**: Get single shift settings.
- **Path Params**: `id` (number, required).

### `PATCH /api/v1/shift/:id`
- **Description**: Modify shift metrics.
- **Path Params**: `id` (number, required).
- **Request Body**:
  - Optionals matching `POST` body structure, except `type` which allows enum: `"morning"`, `"evening"` (Note: `"between"` is not supported on PATCH schema validation).
  - `is_deleted` (boolean, optional).

### `DELETE /api/v1/shift/:id`
- **Description**: Toggle soft deletion of shift structure.

---

## 5. Leave Types

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/leaveType`
- **Description**: Create new category of leaves (e.g., annual, sick, unpaid).
- **Request Body**:
  - `name` (string, required): Min 2, max 100 characters.
  - `annual_balance` (number, required): Total days allocated per year, integer, min 0.
  - `affects_deduction` (boolean, required): True if leave causes salary deduction.
- **Response Shape (Success)**: Leave type object.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "إجازة سنوية اعتيادية",
      "annual_balance": 21,
      "affects_deduction": false
    }
    ```

### `GET /api/v1/leaveType`
- **Query Params**: search keyword on `name`.

### `GET /api/v1/leaveType/:id`
### `PATCH /api/v1/leaveType/:id`
- **Request Body**: Optionals from POST body + `is_deleted` (boolean).

### `DELETE /api/v1/leaveType/:id`

---

## 6. Official Holidays

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/officialHoliday`
- **Description**: Define calendar national/official holiday days.
- **Request Body**:
  - `name` (string, required): Holiday name, min 2, max 100.
  - `start_date` (string/date, required): Date representation when holiday begins.
  - `days_count` (number, optional): Duration of holiday in days, min 1.
- **Response Shape (Success)**: Created holiday record.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "عيد الفطر المبارك",
      "start_date": "2026-03-20",
      "days_count": 3
    }
    ```

### `GET /api/v1/officialHoliday`
- **Query Params**: search keyword on `name`.

### `GET /api/v1/officialHoliday/:id`
### `PATCH /api/v1/officialHoliday/:id`
- **Request Body**: `id` (required), `name` (optional), `start_date` (optional), `days_count` (optional).

### `DELETE /api/v1/officialHoliday/:id`

---

## 7. Accounts

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/account`
- **Description**: Add code and metadata to General Ledger / Chart of Accounts.
- **Request Body**:
  - `name` (string, required): Account name, min 2, max 100.
  - `code` (string, required): Unique system GL code, min 2, max 50.
  - `type` (string, required): Enum: `"asset"`, `"liability"`, `"equity"`, `"revenue"`, `"expense"`.
  - `parent_id` (number, optional): Hierarchical parent ID, allows `null`.
  - `description` (string, optional): Narrative, allows empty string `""` or `null`.
  - `currency` (string, optional): ISO currency symbol of exactly 3 characters (e.g. `"EGP"`).
- **Response Shape (Success)**: Account summary.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "مصروفات الرواتب والأجور",
      "code": "51001",
      "type": "expense",
      "parent_id": 6,
      "description": "الحساب العام لإثبات رواتب الموظفين",
      "currency": "EGP"
    }
    ```

### `GET /api/v1/account`
- **Query Params**: search keyword on `name`, `code`.

### `GET /api/v1/account/:id`
### `PATCH /api/v1/account/:id`
- **Request Body**: `id` (required), optionals matching POST body. Min 1 field required for update.

### `DELETE /api/v1/account/:id`

---

## 8. Allowance Types

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/allowanceType`
- **Description**: Define custom allowances (e.g. travel, housing).
- **Request Body**:
  - `name` (string, required): Min 2, max 100 characters.
  - `default_amount` (number, optional): Baseline allowance value, min 0.
  - `is_part_of_salary` (boolean, optional): True if included in basic calculation models.
  - `account_code` (string, required): Reference code from GL Accounts, min 1, max 20.
- **Response Shape (Success)**: Allowance definition.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "بدل انتقال وسفر",
      "default_amount": 1200.00,
      "is_part_of_salary": true,
      "account_code": "52002"
    }
    ```

### `GET /api/v1/allowanceType`
- **Query Params**: search keyword on `name`, `account_code`.

### `GET /api/v1/allowanceType/:id`
### `PATCH /api/v1/allowanceType/:id`
- **Request Body**: `id` (required), optionals matching POST schema.

### `DELETE /api/v1/allowanceType/:id`

---

## 9. Absence Types

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/absenceType`
- **Description**: Manage categories of absences and their standard multipliers.
- **Request Body**:
  - `name` (string, required): Absence class, min 2, max 100.
  - `deduct_days` (number, required): Multiplier factor for salary deductions (e.g., `1.5` days salary per day absent), min 0, max 30.
  - `requires_permission` (boolean, optional): True if approval requires a medical/excusal document.
- **Response Shape (Success)**: Absence settings object.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "غياب بدون عذر مقبول",
      "deduct_days": 2,
      "requires_permission": false
    }
    ```

### `GET /api/v1/absenceType`
- **Query Params**: search keyword on `name`.

### `GET /api/v1/absenceType/:id`
### `PATCH /api/v1/absenceType/:id`
- **Request Body**: `id` (required), optionals matching POST.

### `DELETE /api/v1/absenceType/:id`

---

## 10. Bonus Types

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/bonusType`
- **Description**: Setup types of performance/deferred payouts.
- **Request Body**:
  - `name` (string, required): Bonus name, min 2, max 100.
  - `payment_type` (string, required): Payout system. Enum: `"cash"`, `"deferred"`.
  - `default_amount` (number, optional): Payout baseline, allows `null`.
  - `editable_amount` (boolean, optional): True if managers can adjust details in grants.
- **Response Shape (Success)**: Bonus configurations.
- **Example**:
  - Request Body:
    ```json
    {
      "name": "مكافأة تميز سنوية",
      "payment_type": "deferred",
      "default_amount": 5000,
      "editable_amount": true
    }
    ```

### `GET /api/v1/bonusType`
- **Query Params**: search keyword on `name`.

### `GET /api/v1/bonusType/:id`
### `PATCH /api/v1/bonusType/:id`
- **Request Body**: `id` (required), optionals matching POST.

### `DELETE /api/v1/bonusType/:id`

---

## 11. Insurance Settings

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/insuranceSettings`
- **Description**: Add national insurance deduction rules.
- **Request Body**:
  - `employee_rate` (number, required): Deduction rate from employee salary, min 0, max 100.
  - `company_rate` (number, required): Rate contribution from employer, min 0, max 100.
  - `effective_from` (string/date, required): Effective activation date.
- **Response Shape (Success)**: Insurance setting object.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_rate": 11,
      "company_rate": 18.75,
      "effective_from": "2026-01-01"
    }
    ```

### `GET /api/v1/insuranceSettings`

### `GET /api/v1/insuranceSettings/:id`
### `PATCH /api/v1/insuranceSettings/:id`
- **Request Body**: `id` (required), optionals matching POST schema. Must provide at least one optional property (min 2 fields overall including `id`).

### `DELETE /api/v1/insuranceSettings/:id`

---

## 12. Employees

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/employee`
- **Description**: Registers a new employee profile.
- **Request Body**:
  - `code` (string, required): Employee ID card / registration code, max 20.
  - `full_name` (string, required): Arabic/English full name, max 200.
  - `birth_date` (string/date, required): ISO Date of birth.
  - `gender` (string, required): Enum: `"M"`, `"F"`.
  - `national_id` (string, required): Exact 14-digit national number.
  - `phone_number` (string, required): Primary phone number, max 20.
  - `phone` (string, optional): Secondary phone number, allows empty or `null`.
  - `email` (string, optional): Email format, max 200, allows empty or `null`.
  - `address` (string, optional): Address narrative, allows empty or `null`.
  - `marital_status` (string, optional): Enum: `"single"`, `"married"`, `"divorced"`, `"widowed"`, allows empty or `null`.
  - `qualification` (string, optional): Education degrees, max 200, allows empty or `null`.
  - `bank_name` (string, optional): Bank name, max 100, allows empty or `null`.
  - `bank_account` (string, optional): Bank account number, max 50, allows empty or `null`.
- **Response Shape (Success)**: Employee profile details.
- **Example**:
  - Request Body:
    ```json
    {
      "code": "EMP-2026-003",
      "full_name": "سامح محمد محمود",
      "birth_date": "1994-05-12",
      "gender": "M",
      "national_id": "29405120102345",
      "phone_number": "01099887766",
      "email": "sameh.mohamed@company.com",
      "marital_status": "married",
      "qualification": "بكالوريوس هندسة حاسبات"
    }
    ```

### `GET /api/v1/employee`
- **Query Params**: search keyword on `full_name`, `code`, `national_id`.

### `GET /api/v1/employee/:id`
### `PATCH /api/v1/employee/:id`
- **Request Body**: `id` (required), optionals from POST + `is_active` (boolean) + `is_deleted` (boolean).

### `DELETE /api/v1/employee/:id`

---

## 13. Employee Documents

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/employeeDocument`
- **Description**: Attach scanned documents (e.g. National ID copy, Graduation Certificate) to employee record.
- **Request Body**:
  - `employee_id` (number, required): Reference ID of employee.
  - `doc_name` (string, required): Document label, max 200.
  - `file_path` (string, required): Storage file path/URL, max 500.
- **Response Shape (Success)**: Document details.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "doc_name": "شهادة التخرج الجامعية",
      "file_path": "/uploads/documents/emp-5-degree.pdf"
    }
    ```

### `GET /api/v1/employeeDocument`
- **Query Params**: search keyword on `doc_name`, `file_path`, `employee_code`, `$Employee.full_name$`.

### `GET /api/v1/employeeDocument/:id`
### `PATCH /api/v1/employeeDocument/:id`
- **Request Body**: `id` (required), `employee_id` (optional), `doc_name` (optional), `file_path` (optional).

### `DELETE /api/v1/employeeDocument/:id`

---

## 14. Employee Relatives

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/employeeRelative`
- **Description**: Add emergency contacts or dependents for tax/insurance.
- **Request Body**:
  - `employee_id` (number, required): Reference ID of employee.
  - `relation` (string, required): Type of relation (e.g. `"زوجة"`, `"أب"`), max 50.
  - `name` (string, required): Relative full name, max 200.
  - `phone` (string, required): Contact number, max 20.
- **Response Shape (Success)**: Relative details.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "relation": "أب",
      "name": "محمود مصطفى علي",
      "phone": "01211223344"
    }
    ```

### `GET /api/v1/employeeRelative`
- **Query Params**: search keyword on `name`, `relation`, `phone`, `employee_code`, `$Employee.full_name$`.

### `GET /api/v1/employeeRelative/:id`
### `PATCH /api/v1/employeeRelative/:id`
- **Request Body**: `id` (required), optionals from POST + `is_deleted` (boolean).

### `DELETE /api/v1/employeeRelative/:id`

---

## 15. Employee Experience

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/employeeExperience`
- **Description**: Add details of employee's previous professional experience.
- **Request Body**:
  - `employee_id` (number, required): Reference ID of employee.
  - `company_name` (string, required): Company label, max 200.
  - `position` (string, optional): Title at company, max 200, allows empty/`null`.
  - `from_date` (string/date, required): Start date.
  - `to_date` (string/date, optional): Resignation date, allows empty/`null`.
- **Response Shape (Success)**: Experience record object.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "company_name": "الشركة العالمية للحلول التقنية",
      "position": "مهندس تطوير برمجيات أول",
      "from_date": "2022-01-01",
      "to_date": "2025-12-31"
    }
    ```

### `GET /api/v1/employeeExperience`
- **Query Params**: search keyword on `company_name`, `position`, `employee_code`, `$Employee.full_name$`.

### `GET /api/v1/employeeExperience/:id`
### `PATCH /api/v1/employeeExperience/:id`
- **Request Body**: `id` (required), optionals from POST + `is_deleted` (boolean).

### `DELETE /api/v1/employeeExperience/:id`

---

## 16. Contracts

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/contract`
- **Description**: Setup employee work contract.
- **Request Body**:
  - `employee_id` (number, required): Reference ID of employee.
  - `department_id` (number, required): Reference ID of department.
  - `shift_id` (number, required): Reference ID of work shift.
  - `job_title` (string, required): Official job role name, min 2, max 200.
  - `start_date` (string/date, required): Job start date.
  - `duration_years` (number, optional): Duration in years, allows `null`.
  - `end_date` (string/date, optional): Contract end date, allows `null`.
  - `base_salary` (number, required): Gross salary base rate, positive value.
  - `status` (string, required): Enum: `"active"`, `"suspended"`, `"resigned"`, `"dismissed"`.
  - `overtime_enabled` (boolean, optional): Flag indicating if overtime is calculated.
  - `notes` (string, optional): allows empty/`null`.
  - `attachment` (string, optional): Scan path, max 500, allows empty/`null`.
  - `insurance_setting_id` (number, required): Reference ID of insurance settings, allows `null`.
- **Response Shape (Success)**: Contract details.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "department_id": 4,
      "shift_id": 1,
      "job_title": "مطور برمجيات أول",
      "start_date": "2026-01-01",
      "base_salary": 15000.00,
      "status": "active",
      "overtime_enabled": true,
      "insurance_setting_id": 2
    }
    ```

### `GET /api/v1/contract`
- **Query Params**: search keyword on `job_title`, `$Employee.full_name$`, `$Employee.code$`.

### `GET /api/v1/contract/:id`
### `PATCH /api/v1/contract/:id`
- **Request Body**: `id` (required), optionals from POST + `is_active` (boolean).

### `DELETE /api/v1/contract/:id`

---

## 17. Contract Allowances

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/contractAllowance`
- **Description**: Link allowances to a contract.
- **Request Body**:
  - `contract_id` (number, required): Reference ID of employee contract.
  - `allowance_type_id` (number, required): Reference ID of allowance settings.
  - `amount` (number, optional): Value override. Must be a positive number.
- **Response Shape (Success)**: Linked contract allowance settings.
- **Example**:
  - Request Body:
    ```json
    {
      "contract_id": 2,
      "allowance_type_id": 1,
      "amount": 1500.00
    }
    ```

### `GET /api/v1/contractAllowance`
- **Query Params**: search keyword on `$EmployeeContract.Employee.full_name$`, `$EmployeeContract.Employee.code$`.

### `GET /api/v1/contractAllowance/:id`
### `PATCH /api/v1/contractAllowance/:id`
- **Request Body**: `id` (required), optionals from POST + `is_deleted` (boolean).

### `DELETE /api/v1/contractAllowance/:id`

---

## 18. Contract Leaves

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/contractLeave`
- **Description**: Records the leave balance used by a contract within a specific year.
- **Request Body**:
  - `contract_id` (number, required): Reference ID of contract.
  - `leave_type_id` (number, required): Reference ID of leave type.
  - `used_days` (number, optional, default: `0`): Number of leaves consumed.
  - `year` (number, required): Year identifier.
- **Response Shape (Success)**: Linked contract leave settings.
- **Example**:
  - Request Body:
    ```json
    {
      "contract_id": 2,
      "leave_type_id": 1,
      "used_days": 4,
      "year": 2026
    }
    ```

### `GET /api/v1/contractLeave`
- **Query Params**: search keyword on `$EmployeeContract.Employee.full_name$`, `$EmployeeContract.Employee.code$`.

### `GET /api/v1/contractLeave/:id`
### `PATCH /api/v1/contractLeave/:id`
- **Request Body**: `id` (required), `contract_id` (optional), `leave_type_id` (optional), `used_days` (optional), `year` (optional).

### `DELETE /api/v1/contractLeave/:id`

---

## 19. Custody

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/custody`
- **Description**: Record tracking transfers of company assets (laptops, vehicles, etc.) to employees.
- **Request Body**:
  - `from_employee_id` (number, optional): ID of employee relinquishing asset, allows `null`.
  - `to_employee_id` (number, required): ID of employee receiving asset.
  - `item_name` (string, required): Asset model/tag name.
  - `transfer_type` (string, required): Enum: `"handover"`, `"receive"`, `"transfer"`.
  - `transfer_date` (string/date, required): Transfer transaction date.
  - `notes` (string, optional): Narrative comments, allows empty/`null`.
- **Response Shape (Success)**: Asset transfer profile.
- **Example**:
  - Request Body:
    ```json
    {
      "from_employee_id": null,
      "to_employee_id": 5,
      "item_name": "MacBook Pro M3 - Serial 829410A",
      "transfer_type": "handover",
      "transfer_date": "2026-06-18",
      "notes": "الجهاز في حالة جديدة مع الشاحن والحقيبة"
    }
    ```

### `GET /api/v1/custody`
- **Query Params**: search keyword on `$fromEmployee.full_name$`, `$fromEmployee.code$`, `$toEmployee.full_name$`, `$toEmployee.code$`, `item_name`.

### `GET /api/v1/custody/:id`
### `PATCH /api/v1/custody/:id`
- **Request Body**: `id` (required), optionals from POST.

### `DELETE /api/v1/custody/:id`

---

## 20. Employee Loans

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/employeeLoan`
- **Description**: Add advances/loans details to employees.
- **Request Body**:
  - `employee_id` (number, required): Employee ID.
  - `type` (string, required): Payout system. Enum: `"advance"`, `"loan"`.
  - `amount` (number, required): Gross payout value, min 0, precision 2.
  - `grant_date` (string/date, required): Payout date.
  - `installment_amount` (number, optional): Monthly installment rate, allows empty/`null`.
  - `paid_amount` (number, optional): Amount settled so far, min 0.
  - `status` (string, required): Enum: `"active"`, `"settled"`.
- **Response Shape (Success)**: Loan details.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "type": "loan",
      "amount": 12000.00,
      "grant_date": "2026-06-01",
      "installment_amount": 1000.00,
      "status": "active"
    }
    ```

### `GET /api/v1/employeeLoan`
- **Query Params**: search keyword on `type`, `status`, `$Employee.full_name$`, `$Employee.code$`.

### `GET /api/v1/employeeLoan/:id`
### `PATCH /api/v1/employeeLoan/:id`
- **Request Body**: `id` (required), optionals from POST + `is_deleted` (boolean).

### `DELETE /api/v1/employeeLoan/:id`

---

## 21. Employee Bonuses

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/employeeBonus`
- **Description**: Grants performance/deferred bonus to employee.
- **Request Body**:
  - `employee_id` (number, required): ID of employee.
  - `bonus_type_id` (number, required): ID of bonus type.
  - `amount` (number, required): bonus value, min 0, precision 2.
  - `grant_date` (string/date, required): ISO Date.
  - `is_paid` (boolean, optional): True if bonus was paid out.
  - `payment_month` (number, optional): Payout month target (1-12), allows empty/`null`.
  - `payment_year` (number, optional): Payout year target (min 1900), allows empty/`null`.
- **Response Shape (Success)**: Payout details.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "bonus_type_id": 1,
      "amount": 2500.00,
      "grant_date": "2026-06-18",
      "is_paid": false,
      "payment_month": 6,
      "payment_year": 2026
    }
    ```

### `GET /api/v1/employeeBonus`
- **Query Params**: search keyword on `is_paid`, `payment_month`, `payment_year`, `$Employee.full_name$`, `$Employee.code$`.

### `GET /api/v1/employeeBonus/:id`
### `PATCH /api/v1/employeeBonus/:id`
- **Request Body**: `id` (required), optionals from POST + `is_deleted` (boolean).

### `DELETE /api/v1/employeeBonus/:id`

---

## 22. Absences

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/absence`
- **Description**: Adds an absence day record for an employee.
- **Request Body**:
  - `employee_id` (number, required): Employee ID.
  - `absence_type_id` (number, required): Absence type reference ID.
  - `absence_date` (string/date, required): Date of the absence.
  - `deduction_days` (number, required): Days to deduct from salary (e.g. `1` or `1.5`), min 0.
  - `notes` (string, optional): Description of absence, allows empty/`null`.
- **Response Shape (Success)**: Absence record summary.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "absence_type_id": 2,
      "absence_date": "2026-06-15",
      "deduction_days": 2,
      "notes": "غياب غير مبرر يوم الإثنين"
    }
    ```

### `GET /api/v1/absence`
- **Query Params**: search keyword on `notes`, `$Employee.full_name$`, `$Employee.code$`.

### `GET /api/v1/absence/:id`
### `PATCH /api/v1/absence/:id`
- **Request Body**: `id` (required), optionals from POST + `is_deleted` (boolean).

### `DELETE /api/v1/absence/:id`

---

## 23. Leave Requests

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/leaveRequest`
- **Description**: Submits or logs leave request.
- **Request Body**:
  - `employee_id` (number, required): Employee ID.
  - `leave_type_id` (number, required): Leave type ID.
  - `start_date` (string/date, required): ISO Start date.
  - `end_date` (string/date, required): ISO End date.
  - `days_count` (number, required): Duration count in days, min 0.5.
  - `status` (string, optional): Enum: `"pending"`, `"approved"`, `"rejected"`.
- **Response Shape (Success)**: Created leave request object.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "leave_type_id": 1,
      "start_date": "2026-07-01",
      "end_date": "2026-07-05",
      "days_count": 5,
      "status": "pending"
    }
    ```

### `GET /api/v1/leaveRequest`
- **Query Params**: search keyword on `status`, `$Employee.full_name$`, `$Employee.code$`.

### `GET /api/v1/leaveRequest/:id`
### `PATCH /api/v1/leaveRequest/:id`
- **Request Body**: `id` (required), optionals from POST + `reason` (string or null, optional) + `is_deleted` (boolean).

### `DELETE /api/v1/leaveRequest/:id`

---

## 24. Attendance

- **Authorization Roles**:
  - **POST / PATCH / DELETE**: `SUPER-ADMIN`, `ADMIN`, `HR`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/attendance`
- **Description**: Record daily attendance check-in/out.
- **Request Body**:
  - `employee_id` (number, required): Employee ID.
  - `work_date` (string/date, required): Date of attendance.
  - `check_in` (string, optional): Check-in time `HH:MM:SS` (e.g. `"08:58:32"`), allows empty/`null`.
  - `check_out` (string, optional): Check-out time `HH:MM:SS` (e.g. `"17:03:15"`), allows empty/`null`.
  - `notes` (string, optional): Remarks, allows empty/`null`.
- **Response Shape (Success)**: Attendance logs.
- **Example**:
  - Request Body:
    ```json
    {
      "employee_id": 5,
      "work_date": "2026-06-18",
      "check_in": "08:58:32",
      "check_out": "17:03:15",
      "notes": "حضور اعتيادي"
    }
    ```

### `GET /api/v1/attendance`
- **Query Params**: search keyword on `notes`, `$Employee.full_name$`, `$Employee.code$`.

### `GET /api/v1/attendance/:id`
### `PATCH /api/v1/attendance/:id`
- **Request Body**:
  - `id` (number, required).
  - `employee_id` (number, optional).
  - `department_id` (number, optional).
  - `work_date` (string/date, optional).
  - `check_in` (string, optional).
  - `check_out` (string, optional).
  - `late_minutes` (number, optional, min 0).
  - `overtime_hours` (number, optional, min 0, precision 2).
  - `notes` (string, optional).
  - `is_deleted` (boolean, optional).

### `DELETE /api/v1/attendance/:id`

---

## 25. Payroll Runs

- **Authorization Roles**:
  - **POST / PATCH / DELETE / RECALCULATE**: `SUPER-ADMIN`, `ADMIN`, `ACCOUNTING`
  - **GET**: `SUPER-ADMIN`, `ADMIN`, `HR`, `ACCOUNTING`

### `POST /api/v1/payrollRun`
- **Description**: Initialize and compute draft payroll for all active employees for a targeted month.
- **Request Body**:
  - `month` (number, required): Target month (1-12).
  - `year` (number, required): Target year (2000-2100).
  - `status` (string, optional): Enum: `"draft"`, `"confirmed"`, `"paid"`.
- **Response Shape (Success)**: Created run meta.
- **Example**:
  - Request Body:
    ```json
    {
      "month": 6,
      "year": 2026,
      "status": "draft"
    }
    ```
  - Response (201):
    ```json
    {
      "meta": {
        "status": 201,
        "success": true,
        "message": "Payroll run created successfully"
      },
      "data": {
        "id": 8,
        "month": 6,
        "year": 2026,
        "status": "draft",
        "is_deleted": false
      }
    }
    ```

### `GET /api/v1/payrollRun`
- **Query Params**: No dynamic search fields (search keyword is ignored).

### `GET /api/v1/payrollRun/:id`
### `PATCH /api/v1/payrollRun/:id`
- **Description**: Update details or confirm/pay status of a payroll run.
- **Request Body**:
  - `id` (number, required).
  - `month` (number, optional, 1-12).
  - `year` (number, optional, 2000-2100).
  - `status` (string, optional): Enum: `"draft"`, `"confirmed"`, `"paid"`.
  - `is_deleted` (boolean, optional).

### `DELETE /api/v1/payrollRun/:id`

### `POST /api/v1/payrollRun/:id/recalculate`
- **Description**: Trigger complete re-calculations for a draft payroll run.
- **Path Params**: `id` (number, required).
- **Response Shape (Success)**:
  ```json
  {
    "meta": {
      "status": 200,
      "success": true,
      "message": "Payroll recalculated successfully"
    },
    "data": null
  }
  ```

---

## 26. Payroll Details

- **Authorization Roles**: `SUPER-ADMIN`, `ADMIN`, `ACCOUNTING`

### `GET /api/v1/payrollDetail/:id`
- **Description**: Fetch all calculations and summaries for a specific payroll run.
- **Path Params**:
  - `id` (number, required): Payroll Run ID.
- **Response Shape (Success)**: Array of employee monthly summaries inside target run.
- **Example**:
  - Request: `GET /api/v1/payrollDetail/8`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "success get all payroll details"
      },
      "data": [
        {
          "id": 41,
          "employee_id": 5,
          "payroll_run_id": 8,
          "base_salary": 15000.00,
          "total_allowances": 1500.00,
          "total_bonus": 2500.00,
          "overtime_amount": 450.00,
          "late_deduction": 150.00,
          "absence_deduction": 0.00,
          "loan_deductions": 1000.00,
          "insurance_deduction": 1650.00,
          "net_salary": 16650.00,
          "Employee": {
            "full_name": "سامح محمد محمود",
            "code": "EMP-2026-003"
          }
        }
      ]
    }
    ```

### `GET /api/v1/payrollDetail/:employee_id/:payroll_run_id`
- **Description**: Fetch detailed pay slip item calculations for a single employee in a run.
- **Path Params**:
  - `employee_id` (number, required).
  - `payroll_run_id` (number, required).
- **Response Shape (Success)**: Itemized payroll slip detailing all lines.
- **Example**:
  - Request: `GET /api/v1/payrollDetail/5/8`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "success get payroll detail"
      },
      "data": {
        "summary": {
          "employee_id": 5,
          "payroll_run_id": 8,
          "base_salary": 15000.00,
          "net_salary": 16650.00
        },
        "details": [
          {
            "id": 182,
            "type": "basic",
            "amount": 15000.00,
            "description": "الراتب الأساسي"
          },
          {
            "id": 183,
            "type": "allowance",
            "amount": 1500.00,
            "description": "بدل انتقال وسفر"
          },
          {
            "id": 184,
            "type": "bonus",
            "amount": 2500.00,
            "description": "مكافأة تميز سنوية"
          },
          {
            "id": 185,
            "type": "deduction",
            "amount": -1000.00,
            "description": "خصم سلفة شهرية"
          }
        ]
      }
    }
    ```

---

## 27. Reports

- **Authorization Roles**: `SUPER-ADMIN`, `ADMIN`, `ACCOUNTING`

### `GET /api/v1/reports/payrollCost/:payroll_run_id`
- **Description**: Total payroll costs report, grouped by departments.
- **Path Params**: `payroll_run_id` (number, required).
- **Response Shape (Success)**: Departmental payroll metrics sum.
- **Example**:
  - Request: `GET /api/v1/reports/payrollCost/8`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Payroll cost report fetched successfully."
      },
      "data": [
        {
          "department_id": 4,
          "department_name": "قسم الموارد البشرية",
          "total_base_salaries": 45000.00,
          "total_allowances": 4500.00,
          "total_bonuses": 5000.00,
          "total_net_payouts": 51500.00,
          "employee_count": 3
        }
      ]
    }
    ```

### `GET /api/v1/reports/loans`
- **Description**: Summarized reporting on employee loans and advances.
- **Response Shape (Success)**: Summarized list of active and settled loans.
- **Example**:
  - Request: `GET /api/v1/reports/loans`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Loans report fetched successfully."
      },
      "data": {
        "total_active_loans_amount": 75000.00,
        "total_active_loans_count": 8,
        "total_settled_loans_amount": 120000.00,
        "total_settled_loans_count": 15,
        "loans": [
          {
            "id": 1,
            "employee_id": 5,
            "employee_name": "سامح محمد محمود",
            "type": "loan",
            "amount": 12000.00,
            "paid_amount": 3000.00,
            "remaining_amount": 9000.00,
            "status": "active"
          }
        ]
      }
    }
    ```

### `GET /api/v1/reports/deductions/:payroll_run_id`
- **Description**: Report analyzing deductions (late, absence, loan, insurance) for a payroll run.
- **Path Params**: `payroll_run_id` (number, required).
- **Response Shape (Success)**: Itemized list of deductions.
- **Example**:
  - Request: `GET /api/v1/reports/deductions/8`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Deductions analysis fetched successfully."
      },
      "data": {
        "total_deductions": 2800.00,
        "breakdown": {
          "late_deductions": 150.00,
          "absence_deductions": 0.00,
          "loan_deductions": 1000.00,
          "insurance_deductions": 1650.00
        }
      }
    }
    ```

### `GET /api/v1/reports/kpis/:payroll_run_id`
- **Description**: Fetch critical monthly operational KPIs (counts, averages) for a run.
- **Path Params**: `payroll_run_id` (number, required).
- **Response Shape (Success)**: KPIs object.
- **Example**:
  - Request: `GET /api/v1/reports/kpis/8`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Monthly KPIs fetched successfully."
      },
      "data": {
        "total_employees": 24,
        "average_net_salary": 8500.00,
        "highest_net_salary": 24000.00,
        "lowest_net_salary": 4500.00,
        "total_overtime_hours": 120.50,
        "total_absence_days": 8.00
      }
    }
    ```

### `GET /api/v1/reports/yearly-kpis`
- **Description**: Broad yearly overview KPIs of employee metrics and organizational trends.
- **Response Shape (Success)**: Yearly KPIs summary.
- **Example**:
  - Request: `GET /api/v1/reports/yearly-kpis`
  - Response (200):
    ```json
    {
      "meta": {
        "status": 200,
        "success": true,
        "message": "Yearly KPIs fetched successfully."
      },
      "data": {
        "year": 2026,
        "total_payroll_payout_yearly": 2445000.00,
        "average_active_employee_count": 22.5,
        "total_loans_granted_yearly": 95000.00,
        "employee_turnover_rate": 4.2
      }
    }
    ```
