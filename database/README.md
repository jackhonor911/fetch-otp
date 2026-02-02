# OTP Fetch Application - Database Documentation

## Overview

This directory contains the database schema, migrations, and seed data for the OTP Fetch Application. The database is named `dsa` and uses MySQL with InnoDB engine.

## Database Connection

```bash
mysql -uroot -proot --ssl-mode=DISABLED -A
```

## Table of Contents

- [Schema Structure](#schema-structure)
- [Table Descriptions](#table-descriptions)
- [Relationships](#relationships)
- [Setup Instructions](#setup-instructions)
- [Running Migrations](#running-migrations)
- [Seeding the Database](#seeding-the-database)
- [Resetting the Database](#resetting-the-database)
- [Default Credentials](#default-credentials)

---

## Schema Structure

The database consists of 4 main tables:

| Table | Purpose |
|-------|---------|
| `users` | Stores user authentication credentials and profile information |
| `otps` | Stores OTP records retrieved from the production database |
| `sessions` | Stores active user sessions for JWT token management |
| `audit_log` | Stores audit trail for security and compliance |

---

## Table Descriptions

### users

Stores user authentication credentials and profile information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT UNSIGNED | Primary key, auto-incrementing |
| `username` | VARCHAR(50) | Unique username for login |
| `password_hash` | VARCHAR(255) | Bcrypt hashed password (60 chars) |
| `email` | VARCHAR(100) | Optional email address |
| `role` | ENUM('admin', 'user') | User role, defaults to 'user' |
| `is_active` | BOOLEAN | Account status flag, defaults to TRUE |
| `failed_login_attempts` | INT | Counter for failed login attempts |
| `locked_until` | DATETIME | Timestamp for account lock expiration |
| `created_at` | DATETIME | Account creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

**Indexes:**
- `idx_username` - For fast username lookups
- `idx_email` - For fast email lookups
- `idx_is_active` - For filtering active users

### otps

Stores OTP records retrieved from the production database.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT UNSIGNED | Primary key, auto-incrementing |
| `mobile_number` | VARCHAR(20) | Mobile number associated with OTP |
| `otp_code` | VARCHAR(10) | The OTP code |
| `created_at` | DATETIME | When the OTP was created |
| `expires_at` | DATETIME | When the OTP expires (optional) |
| `is_used` | BOOLEAN | Whether the OTP has been used |
| `used_at` | DATETIME | When the OTP was used |

**Indexes:**
- `idx_mobile_number` - For fast mobile number lookups
- `idx_created_at` - For time-based queries
- `idx_mobile_created` - Composite index for mobile + time queries
- `idx_expires_at` - For finding expired OTPs
- `idx_is_used` - For filtering used/unused OTPs

### sessions

Stores active user sessions for JWT token management.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT UNSIGNED | Primary key, auto-incrementing |
| `user_id` | INT UNSIGNED | Foreign key to users table |
| `token` | VARCHAR(255) | JWT token for session |
| `expires_at` | DATETIME | Session expiration timestamp |
| `created_at` | DATETIME | Session creation timestamp |
| `revoked_at` | DATETIME | When the session was revoked |

**Indexes:**
- `idx_user_id` - For finding user sessions
- `idx_token` - For fast token lookups
- `idx_expires_at` - For finding expired sessions
- `idx_revoked_at` - For filtering revoked sessions

### audit_log

Stores audit trail for security and compliance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED | Primary key, auto-incrementing |
| `user_id` | INT UNSIGNED | Foreign key to users table (nullable) |
| `action` | VARCHAR(50) | Action performed (e.g., 'login', 'otp_fetch') |
| `ip_address` | VARCHAR(45) | Client IP address (IPv4/IPv6) |
| `user_agent` | TEXT | Client user agent string |
| `details` | JSON | Additional details as JSON |
| `created_at` | DATETIME | Log entry timestamp |

**Indexes:**
- `idx_user_id` - For finding user actions
- `idx_action` - For filtering by action type
- `idx_created_at` - For time-based queries
- `idx_ip_address` - For filtering by IP address

---

## Relationships

```
users (1) ----< (N) sessions
users (1) ----< (N) audit_log
```

- **users → sessions**: One-to-many relationship. When a user is deleted, all their sessions are cascaded (ON DELETE CASCADE).
- **users → audit_log**: One-to-many relationship. When a user is deleted, audit logs retain the user_id as NULL (ON DELETE SET NULL).
- **otps**: Standalone table with no foreign key relationships.

---

## Setup Instructions

### Prerequisites

- MySQL 5.7+ or MySQL 8.0+
- MySQL root access with credentials: `root` / `root`

### Running the Schema Creation

To create the database and all tables from scratch:

```bash
mysql -uroot -proot --ssl-mode=DISABLED -A < database/schema.sql
```

This will:
1. Create the `dsa` database if it doesn't exist
2. Create all 4 tables with proper indexes and constraints
3. Create the `schema_migrations` table for version tracking

---

## Running Migrations

Migrations are located in the `database/migrations/` directory. Each migration file is numbered sequentially.

### Running a Single Migration

```bash
mysql -uroot -proot --ssl-mode=DISABLED -A dsa < database/migrations/001_initial_schema.sql
```

### Running All Migrations

```bash
for file in database/migrations/*.sql; do
    mysql -uroot -proot --ssl-mode=DISABLED -A dsa < "$file"
done
```

### Checking Applied Migrations

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

---

## Seeding the Database

Seed data includes a default admin user and sample OTP records for testing.

### Running the Seed Script

```bash
mysql -uroot -proot --ssl-mode=DISABLED -A dsa < database/seed.sql
```

### Seed Data Summary

| Table | Records | Description |
|-------|---------|-------------|
| `users` | 1 | Default admin user |
| `otps` | 10 | Sample OTPs (5 unused, 3 used, 2 expired) |
| `sessions` | 2 | Sample sessions (1 active, 1 revoked) |
| `audit_log` | 4 | Sample audit log entries |

---

## Resetting the Database

To completely reset the database (drop and recreate):

### Option 1: Using MySQL Commands

```bash
mysql -uroot -proot --ssl-mode=DISABLED -A -e "DROP DATABASE IF EXISTS dsa; CREATE DATABASE dsa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -uroot -proot --ssl-mode=DISABLED -A dsa < database/schema.sql
mysql -uroot -proot --ssl-mode=DISABLED -A dsa < database/seed.sql
```

### Option 2: Using a Reset Script

Create a file `database/reset.sql`:

```sql
DROP DATABASE IF EXISTS dsa;
CREATE DATABASE dsa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dsa;
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

Then run:

```bash
mysql -uroot -proot --ssl-mode=DISABLED -A < database/reset.sql
```

---

## Default Credentials

After running the seed script, you can log in with the following credentials:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `SecurePass123!` |
| **Role** | `admin` |
| **Email** | `admin@example.com` |

**Note:** The password is hashed using bcrypt with 12 salt rounds. The hash stored in the database is:
```
$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYwWjZJqW6e
```

---

## Common Queries

### View All Users

```sql
SELECT id, username, email, role, is_active, created_at FROM users;
```

### View Recent OTPs

```sql
SELECT * FROM otps ORDER BY created_at DESC LIMIT 10;
```

### View Active Sessions

```sql
SELECT s.id, u.username, s.expires_at, s.created_at 
FROM sessions s 
JOIN users u ON s.user_id = u.id 
WHERE s.revoked_at IS NULL AND s.expires_at > NOW();
```

### View Audit Log

```sql
SELECT al.id, u.username, al.action, al.ip_address, al.created_at 
FROM audit_log al 
LEFT JOIN users u ON al.user_id = u.id 
ORDER BY al.created_at DESC LIMIT 20;
```

### Clean Up Expired Sessions

```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### Clean Up Expired OTPs

```sql
DELETE FROM otps WHERE expires_at < NOW() AND is_used = FALSE;
```

---

## Database Configuration

### Character Set and Collation

All tables use:
- **Character Set:** `utf8mb4` (supports full Unicode including emojis)
- **Collation:** `utf8mb4_unicode_ci` (case-insensitive Unicode sorting)

### Engine

All tables use the **InnoDB** engine for:
- ACID compliance
- Foreign key constraints
- Row-level locking
- Transaction support

---

## File Structure

```
database/
├── README.md                    # This documentation file
├── schema.sql                   # Complete database schema
├── seed.sql                     # Seed data for testing
└── migrations/
    └── 001_initial_schema.sql   # Initial schema migration
```

---

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
2. **Foreign Keys**: Proper foreign key constraints with CASCADE/SET NULL actions
3. **Indexes**: Strategic indexes on frequently queried columns for performance
4. **Audit Trail**: All important actions are logged in the `audit_log` table
5. **Session Management**: Sessions can be revoked and have expiration times

---

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

Ensure your MySQL credentials are correct. Update the connection string with your actual credentials.

### Error: "Unknown database 'dsa'"

Run the schema creation script first to create the database:
```bash
mysql -uroot -proot --ssl-mode=DISABLED -A < database/schema.sql
```

### Error: "Table 'dsa.users' doesn't exist"

Ensure the schema has been created before running migrations or seeds:
```bash
mysql -uroot -proot --ssl-mode=DISABLED -A < database/schema.sql
```

---

## Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Bcrypt Password Hashing](https://github.com/kelektiv/node.bcrypt.js)
- [Project Architecture](../plans/architecture.md)
