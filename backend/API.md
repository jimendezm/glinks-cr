# Glinks CR API Reference

Base URL: `http://localhost:3000/api`

All request and response bodies use `Content-Type: application/json`.

---

## Common Conventions

### Authentication

Protected endpoints require a JWT token sent via the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained from the login endpoint and expire after the duration configured in `JWT_EXPIRES_IN` (default: 24h).

### Standard Success Response

Every successful response follows this shape:

```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response

Errors are returned with the appropriate HTTP status code:

```json
{
  "success": false,
  "error": "Description of the error"
}
```

### Pagination

List endpoints accept optional query parameters:

| Parameter | Type   | Default | Description              |
|-----------|--------|---------|--------------------------|
| `page`    | number | 1       | Page number (min: 1)     |
| `limit`   | number | 20      | Items per page (min: 1, max: 100) |

Paginated responses include a `pagination` object:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Auth

### POST `/auth/register`

Creates a new user account.

**Auth required:** No

**Request body:**

| Field      | Type   | Constraints          | Required |
|------------|--------|----------------------|----------|
| `username` | string | 1–255 characters     | Yes      |
| `password` | string | 12–255 characters    | Yes      |
| `role`     | string | `"admin"` or `"tecnico"` | Yes  |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "role": "admin | tecnico",
    "createdAt": "ISO 8601 datetime"
  }
}
```

**Errors:**
- `500` — Username already in use.

---

### POST `/auth/login`

Authenticates a user and returns a JWT token.

**Auth required:** No

**Request body:**

| Field      | Type   | Constraints       | Required |
|------------|--------|-------------------|----------|
| `username` | string | 1–255 characters  | Yes      |
| `password` | string | 12–255 characters | Yes      |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "jwt string",
    "user": {
      "id": "uuid",
      "username": "string",
      "role": "admin | tecnico"
    }
  }
}
```

**Errors:**
- `500` — Invalid credentials.

---

### GET `/auth/me`

Returns the authenticated user's profile.

**Auth required:** Yes

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "string",
    "role": "admin | tecnico"
  }
}
```

---

## Physical Clients (Clientes Físicos)

All endpoints under `/clientes-fisicos` require authentication.

### GET `/clientes-fisicos`

Returns a paginated list of all physical clients, ordered by creation date (newest first).

**Query parameters:** `page`, `limit` (see Pagination).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "national_id": "string",
      "name": "string",
      "last_name_1": "string",
      "last_name_2": "string",
      "primary_phone": "string",
      "secondary_phone": "string | null",
      "email": "string | null",
      "address": "string",
      "exonerated": "boolean",
      "createdAt": "ISO 8601 datetime"
    }
  ],
  "pagination": { ... }
}
```

---

### GET `/clientes-fisicos/search`

Searches physical clients by name (fuzzy, case-insensitive partial match on name, lastName1, and lastName2) and/or national ID (exact match).

**Query parameters:**

| Parameter    | Type   | Required | Description                                    |
|--------------|--------||----------|------------------------------------------------|
| `name`       | string | No       | Fuzzy match against name, last_name_1, last_name_2 |
| `nationalId` | string | No       | Exact match against national_id                |
| `page`       | number | No       | Page number (default: 1)                       |
| `limit`      | number | No       | Items per page (default: 20)                   |

At least one of `name` or `nationalId` should be provided for meaningful results.

**Response:** `200 OK` — Same shape as the list endpoint with pagination.

---

### GET `/clientes-fisicos/:id`

Returns a single physical client by ID.

**Path parameters:**

| Parameter | Type | Description         |
|-----------|------|---------------------|
| `id`      | uuid | The client's ID     |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "national_id": "string",
    "name": "string",
    "last_name_1": "string",
    "last_name_2": "string",
    "primary_phone": "string",
    "secondary_phone": "string | null",
    "email": "string | null",
    "address": "string",
    "exonerated": "boolean",
    "createdAt": "ISO 8601 datetime"
  }
}
```

**Errors:**
- `500` — Client not found.

---

### POST `/clientes-fisicos`

Creates a new physical client.

**Request body:**

| Field            | Type    | Constraints                                      | Required |
|------------------|---------|--------------------------------------------------|----------|
| `nationalId`     | string  | Exactly 7 digits, first digit 1–9               | Yes      |
| `name`           | string  | 1–50 characters                                  | Yes      |
| `lastName1`      | string  | 1–50 characters                                  | Yes      |
| `lastName2`      | string  | 1–50 characters                                  | Yes      |
| `primaryPhone`   | string  | 8 digits, first digit 2–8                        | Yes      |
| `secondaryPhone` | string  | 8 digits, first digit 2–8                        | No       |
| `email`          | string  | Valid email format                               | No       |
| `address`        | string  | 1–255 characters                                 | Yes      |
| `exonerated`     | boolean | —                                                | Yes      |

**Response:** `201 Created` — The created client object.

**Errors:**
- `500` — Unique constraint violation (duplicate `national_id`).

---

### PUT `/clientes-fisicos/:id`

Partially updates a physical client. Only provided fields are modified; omitted fields remain unchanged.

**Path parameters:**

| Parameter | Type | Description         |
|-----------|------|---------------------|
| `id`      | uuid | The client's ID     |

**Request body:** Same fields as POST, but all are optional.

| Field            | Type    | Constraints                                      | Required |
|------------------|---------|--------------------------------------------------|----------|
| `nationalId`     | string  | Exactly 7 digits, first digit 1–9               | No       |
| `name`           | string  | 1–50 characters                                  | No       |
| `lastName1`      | string  | 1–50 characters                                  | No       |
| `lastName2`      | string  | 1–50 characters                                  | No       |
| `primaryPhone`   | string  | 8 digits, first digit 2–8                        | No       |
| `secondaryPhone` | string  | 8 digits, first digit 2–8                        | No       |
| `email`          | string  | Valid email format                               | No       |
| `address`        | string  | 1–255 characters                                 | No       |
| `exonerated`     | boolean | —                                                | No       |

**Response:** `200 OK` — The updated client object.

**Errors:**
- `500` — Client not found or unique constraint violation.

---

### DELETE `/clientes-fisicos/:id`

Deletes a physical client.

**Path parameters:**

| Parameter | Type | Description         |
|-----------|------|---------------------|
| `id`      | uuid | The client's ID     |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Cliente físico eliminado correctamente"
}
```

**Errors:**
- `500` — Client not found or foreign key constraint violation (client has linked maintenances/invoices).

---

## Legal Clients (Clientes Jurídicos)

All endpoints under `/clientes-juridicos` require authentication.

### GET `/clientes-juridicos`

Returns a paginated list of all legal clients, ordered by creation date (newest first).

**Query parameters:** `page`, `limit` (see Pagination).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "legal_id": "string",
      "name": "string",
      "primary_phone": "string",
      "secondary_phone": "string | null",
      "email": "string | null",
      "address": "string",
      "exonerated": "boolean",
      "createdAt": "ISO 8601 datetime"
    }
  ],
  "pagination": { ... }
}
```

---

### GET `/clientes-juridicos/search`

Searches legal clients by name (fuzzy, case-insensitive partial match) and/or legal ID (exact match).

**Query parameters:**

| Parameter | Type   | Required | Description                         |
|-----------|--------|----------|-------------------------------------|
| `name`    | string | No       | Fuzzy match against name            |
| `legalId` | string | No       | Exact match against legal_id        |
| `page`    | number | No       | Page number (default: 1)            |
| `limit`   | number | No       | Items per page (default: 20)        |

At least one of `name` or `legalId` should be provided for meaningful results.

**Response:** `200 OK` — Same shape as the list endpoint with pagination.

---

### GET `/clientes-juridicos/:id`

Returns a single legal client by ID.

**Path parameters:**

| Parameter | Type | Description         |
|-----------|------|---------------------|
| `id`      | uuid | The client's ID     |

**Response:** `200 OK` — The legal client object.

**Errors:**
- `500` — Client not found.

---

### POST `/clientes-juridicos`

Creates a new legal client.

**Request body:**

| Field            | Type    | Constraints                                      | Required |
|------------------|---------|--------------------------------------------------|----------|
| `legalId`        | string  | Exactly 10 digits, first digit 1–9              | Yes      |
| `name`           | string  | 1–50 characters                                  | Yes      |
| `primaryPhone`   | string  | 8 digits, first digit 2–8                        | Yes      |
| `secondaryPhone` | string  | 8 digits, first digit 2–8                        | No       |
| `email`          | string  | Valid email format                               | No       |
| `address`        | string  | 1–255 characters                                 | Yes      |
| `exonerated`     | boolean | —                                                | Yes      |

**Response:** `201 Created` — The created legal client object.

**Errors:**
- `500` — Unique constraint violation (duplicate `legal_id`).

---

### PUT `/clientes-juridicos/:id`

Partially updates a legal client. Only provided fields are modified.

**Path parameters:**

| Parameter | Type | Description         |
|-----------|------|---------------------|
| `id`      | uuid | The client's ID     |

**Request body:** Same fields as POST, but all are optional.

| Field            | Type    | Constraints                                      | Required |
|------------------|---------|--------------------------------------------------|----------|
| `legalId`        | string  | Exactly 10 digits, first digit 1–9              | No       |
| `name`           | string  | 1–50 characters                                  | No       |
| `primaryPhone`   | string  | 8 digits, first digit 2–8                        | No       |
| `secondaryPhone` | string  | 8 digits, first digit 2–8                        | No       |
| `email`          | string  | Valid email format                               | No       |
| `address`        | string  | 1–255 characters                                 | No       |
| `exonerated`     | boolean | —                                                | No       |

**Response:** `200 OK` — The updated legal client object.

**Errors:**
- `500` — Client not found or unique constraint violation.

---

### DELETE `/clientes-juridicos/:id`

Deletes a legal client.

**Path parameters:**

| Parameter | Type | Description         |
|-----------|------|---------------------|
| `id`      | uuid | The client's ID     |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Cliente jurídico eliminado correctamente"
}
```

**Errors:**
- `500` — Client not found or foreign key constraint violation.

---

## Maintenances (Mantenimientos)

All endpoints under `/mantenimientos` require authentication.

### GET `/mantenimientos/fisicos`

Returns a paginated list of all maintenances associated with physical clients (where `physical_client_id` is not null), ordered by date (newest first).

**Query parameters:** `page`, `limit` (see Pagination).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "ISO 8601 datetime",
      "description": "string",
      "physical_client_id": "uuid",
      "legal_client_id": null,
      "responsible_id": "uuid",
      "responsible": {
        "id": "uuid",
        "username": "string",
        "role": "admin | tecnico"
      },
      "physical_client": { ... },
      "legal_client": null,
      "maintenanceProducts": [
        {
          "id": "uuid",
          "amount": "number",
          "maintenance_id": "uuid",
          "product_id": "uuid",
          "product": { ... }
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

### POST `/mantenimientos/fisicos`

Creates a maintenance record for a physical client.

**Request body:**

| Field                 | Type   | Constraints              | Required |
|-----------------------|--------|--------------------------|----------|
| `date`                | string | ISO 8601 date format     | Yes      |
| `description`         | string | 1–255 characters         | Yes      |
| `physicalClientId`    | string | UUID                     | Yes      |
| `responsibleId`       | string | UUID                     | Yes      |
| `maintenanceProducts` | Array  | See below                | Yes      |

**`maintenanceProducts` item:**

| Field       | Type   | Constraints      | Required |
|-------------|--------|------------------|----------|
| `productId` | string | UUID             | Yes      |
| `amount`    | number | Positive integer | Yes      |

**Response:** `201 Created` — The created maintenance object with included relations.

**Errors:**
- `500` — Foreign key constraint violation (invalid client, responsible, or product ID).

---

### GET `/mantenimientos/juridicos`

Returns a paginated list of all maintenances associated with legal clients (where `legal_client_id` is not null), ordered by date (newest first).

**Query parameters:** `page`, `limit` (see Pagination).

**Response:** `200 OK` — Same shape as the physical maintenances list, but with `legal_client_id` populated and `physical_client_id` null.

---

### POST `/mantenimientos/juridicos`

Creates a maintenance record for a legal client.

**Request body:**

| Field             | Type   | Constraints              | Required |
|-------------------|--------|--------------------------|----------|
| `date`            | string | ISO 8601 date format     | Yes      |
| `description`     | string | 1–255 characters         | Yes      |
| `legalClientId`   | string | UUID                     | Yes      |
| `responsibleId`   | string | UUID                     | Yes      |
| `maintenanceProducts` | Array | See below             | Yes      |

**`maintenanceProducts` item:**

| Field       | Type   | Constraints      | Required |
|-------------|--------|------------------|----------|
| `productId` | string | UUID             | Yes      |
| `amount`    | number | Positive integer | Yes      |

**Response:** `201 Created` — The created maintenance object with included relations.

**Errors:**
- `500` — Foreign key constraint violation.

---

## Invoices (Facturación)

All endpoints under `/facturas` require authentication.

### GET `/facturas`

Returns a paginated list of all invoices, ordered by date (newest first).

**Query parameters:** `page`, `limit` (see Pagination).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "ISO 8601 datetime",
      "physical_client_id": "uuid | null",
      "legal_client_id": "uuid | null",
      "physicalClient": { ... } | null,
      "legalClient": { ... } | null,
      "serviceProductItems": [
        {
          "id": "uuid",
          "invoice_id": "uuid",
          "product_id": "uuid",
          "start_date": "ISO 8601 datetime",
          "end_date": "ISO 8601 datetime",
          "product": { ... }
        }
      ],
      "physicalProductItems": [
        {
          "id": "uuid",
          "invoice_id": "uuid",
          "product_id": "uuid",
          "amount": "number",
          "product": { ... }
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

### GET `/facturas/:id`

Returns a single invoice by ID with all related items and client data.

**Path parameters:**

| Parameter | Type | Description        |
|-----------|------|--------------------|
| `id`      | uuid | The invoice's ID   |

**Response:** `200 OK` — The invoice object with included relations.

**Errors:**
- `500` — Invoice not found.

---

### POST `/facturas/fisicos`

Creates an invoice for a physical client with product items and service items.

**Request body:**

| Field                | Type   | Constraints           | Required |
|----------------------|--------|-----------------------|----------|
| `physicalClientId`   | string | UUID                  | Yes      |
| `physicalProductItems` | Array | See below            | Yes      |
| `serviceProductItems`  | Array | See below            | Yes      |

**`physicalProductItems` item:**

| Field       | Type   | Constraints      | Required |
|-------------|--------|------------------|----------|
| `productId` | string | UUID             | Yes      |
| `amount`    | number | Positive integer | Yes      |

**`serviceProductItems` item:**

| Field       | Type   | Constraints              | Required |
|-------------|--------|--------------------------|----------|
| `productId` | string | UUID                     | Yes      |
| `startDate` | string | ISO 8601 date format     | Yes      |
| `endDate`   | string | ISO 8601 date format     | Yes      |

**Response:** `201 Created` — The created invoice object with all included relations.

**Errors:**
- `500` — Foreign key constraint violation (invalid client or product ID).

---

### POST `/facturas/juridicos`

Creates an invoice for a legal client with product items and service items.

**Request body:**

| Field                | Type   | Constraints           | Required |
|----------------------|--------|-----------------------|----------|
| `legalClientId`      | string | UUID                  | Yes      |
| `physicalProductItems` | Array | See below            | Yes      |
| `serviceProductItems`  | Array | See below            | Yes      |

**`physicalProductItems` item:**

| Field       | Type   | Constraints      | Required |
|-------------|--------|------------------|----------|
| `productId` | string | UUID             | Yes      |
| `amount`    | number | Positive integer | Yes      |

**`serviceProductItems` item:**

| Field       | Type   | Constraints              | Required |
|-------------|--------|--------------------------|----------|
| `productId` | string | UUID                     | Yes      |
| `startDate` | string | ISO 8601 date format     | Yes      |
| `endDate`   | string | ISO 8601 date format     | Yes      |

**Response:** `201 Created` — The created invoice object with all included relations.

**Errors:**
- `500` — Foreign key constraint violation.

---

## Health Check

### GET `/health`

Returns server status. Requires no authentication.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "ISO 8601 datetime"
  }
}
```