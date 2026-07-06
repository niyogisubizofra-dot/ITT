-- ====================================================================
-- PostgreSQL Database Initialization Script (EMS Backend)
-- ====================================================================

-- 1. Create Enums and Custom Types (if not already existing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
        CREATE TYPE "enum_Users_role" AS ENUM ('CEO', 'Chairman', 'Project Manager', 'Finance Manager', 'Operations Manager', 'HR Manager', 'Staff', 'Client');
    END IF;
END
$$;

-- 2. Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS "Messages" CASCADE;
DROP TABLE IF EXISTS "Events" CASCADE;
DROP TABLE IF EXISTS "Transactions" CASCADE;
DROP TABLE IF EXISTS "Reports" CASCADE;
DROP TABLE IF EXISTS "Announcements" CASCADE;
DROP TABLE IF EXISTS "ActivityLogs" CASCADE;
DROP TABLE IF EXISTS "Notifications" CASCADE;
DROP TABLE IF EXISTS "Documents" CASCADE;
DROP TABLE IF EXISTS "Partnerships" CASCADE;
DROP TABLE IF EXISTS "LeaveRequests" CASCADE;
DROP TABLE IF EXISTS "Attendances" CASCADE;
DROP TABLE IF EXISTS "Payrolls" CASCADE;
DROP TABLE IF EXISTS "Budgets" CASCADE;
DROP TABLE IF EXISTS "Expenses" CASCADE;
DROP TABLE IF EXISTS "Revenues" CASCADE;
DROP TABLE IF EXISTS "Tasks" CASCADE;
DROP TABLE IF EXISTS "ProjectTeams" CASCADE;
DROP TABLE IF EXISTS "Projects" CASCADE;
DROP TABLE IF EXISTS "Clients" CASCADE;
DROP TABLE IF EXISTS "Employees" CASCADE;
DROP TABLE IF EXISTS "Departments" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- 3. Create Tables

-- USERS Table
CREATE TABLE "Users" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "role" "enum_Users_role" DEFAULT 'Client'::"enum_Users_role" NOT NULL,
    "referralCode" VARCHAR(255) UNIQUE,
    "referredBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "balance" DECIMAL(12, 2) DEFAULT 0.00,
    "referralEarnings" DECIMAL(12, 2) DEFAULT 0.00,
    "is2FAEnabled" BOOLEAN DEFAULT FALSE,
    "twoFASecret" VARCHAR(255),
    "twoFASecretTemp" VARCHAR(255),
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- DEPARTMENTS Table
CREATE TABLE "Departments" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "managerId" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- EMPLOYEES Table
CREATE TABLE "Employees" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE REFERENCES "Users"("id") ON DELETE CASCADE,
    "departmentId" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
    "position" VARCHAR(255) NOT NULL,
    "salary" DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    "hireDate" DATE DEFAULT CURRENT_DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'Active' NOT NULL CHECK ("status" IN ('Active', 'Terminated', 'On Leave')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CLIENTS Table
CREATE TABLE "Clients" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phone" VARCHAR(255),
    "company" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'Active' NOT NULL CHECK ("status" IN ('Active', 'Inactive')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- PROJECTS Table
CREATE TABLE "Projects" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'Planning' NOT NULL CHECK ("status" IN ('Planning', 'In Progress', 'Completed', 'On Hold')),
    "budget" DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "clientId" INTEGER REFERENCES "Clients"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- PROJECT TEAMS Table
CREATE TABLE "ProjectTeams" (
    "id" SERIAL PRIMARY KEY,
    "projectId" INTEGER NOT NULL REFERENCES "Projects"("id") ON DELETE CASCADE,
    "employeeId" INTEGER NOT NULL REFERENCES "Employees"("id") ON DELETE CASCADE,
    "role" VARCHAR(255) DEFAULT 'Member' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TASKS Table
CREATE TABLE "Tasks" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'Pending' NOT NULL CHECK ("status" IN ('Pending', 'In Progress', 'Completed')),
    "priority" VARCHAR(50) DEFAULT 'Medium' NOT NULL CHECK ("priority" IN ('Low', 'Medium', 'High')),
    "projectId" INTEGER REFERENCES "Projects"("id") ON DELETE SET NULL,
    "assigneeId" INTEGER REFERENCES "Employees"("id") ON DELETE SET NULL,
    "dueDate" DATE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- REVENUES Table
CREATE TABLE "Revenues" (
    "id" SERIAL PRIMARY KEY,
    "amount" DECIMAL(12, 2) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "date" DATE DEFAULT CURRENT_DATE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- EXPENSES Table
CREATE TABLE "Expenses" (
    "id" SERIAL PRIMARY KEY,
    "amount" DECIMAL(12, 2) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "date" DATE DEFAULT CURRENT_DATE NOT NULL,
    "description" TEXT,
    "approvedById" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- BUDGETS Table
CREATE TABLE "Budgets" (
    "id" SERIAL PRIMARY KEY,
    "amount" DECIMAL(12, 2) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "spentAmount" DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- PAYROLLS Table
CREATE TABLE "Payrolls" (
    "id" SERIAL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL REFERENCES "Employees"("id") ON DELETE CASCADE,
    "amount" DECIMAL(12, 2) NOT NULL,
    "bonus" DECIMAL(12, 2) DEFAULT 0.00,
    "deductions" DECIMAL(12, 2) DEFAULT 0.00,
    "payDate" DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'Pending' NOT NULL CHECK ("status" IN ('Paid', 'Pending')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ATTENDANCES Table
CREATE TABLE "Attendances" (
    "id" SERIAL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL REFERENCES "Employees"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "checkIn" VARCHAR(255),
    "checkOut" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'Present' NOT NULL CHECK ("status" IN ('Present', 'Absent', 'Late', 'Half Day')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- LEAVE REQUESTS Table
CREATE TABLE "LeaveRequests" (
    "id" SERIAL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL REFERENCES "Employees"("id") ON DELETE CASCADE,
    "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid')),
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'Pending' NOT NULL CHECK ("status" IN ('Pending', 'Approved', 'Rejected')),
    "approvedById" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- PARTNERSHIPS Table
CREATE TABLE "Partnerships" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('Sponsor', 'Investor', 'Strategic', 'Vendor')),
    "contactPerson" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'Proposed' NOT NULL CHECK ("status" IN ('Proposed', 'Active', 'Terminated')),
    "fundingAmount" DECIMAL(12, 2) DEFAULT 0.00,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- DOCUMENTS Table
CREATE TABLE "Documents" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) DEFAULT 'General',
    "projectId" INTEGER REFERENCES "Projects"("id") ON DELETE CASCADE,
    "uploadedById" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- NOTIFICATIONS Table
CREATE TABLE "Notifications" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ACTIVITY LOGS Table
CREATE TABLE "ActivityLogs" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES "Users"("id") ON DELETE CASCADE,
    "action" VARCHAR(255) NOT NULL,
    "ipAddress" VARCHAR(255),
    "details" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ANNOUNCEMENTS Table
CREATE TABLE "Announcements" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- REPORTS Table
CREATE TABLE "Reports" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "createdById" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TRANSACTIONS Table (Welcome rewards & multi-level commission log)
CREATE TABLE "Transactions" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "type" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- EVENTS Table (Calendar Events)
CREATE TABLE "Events" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "type" VARCHAR(255) DEFAULT 'Meeting' NOT NULL,
    "organizerId" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- MESSAGES Table (Support Chat Logs)
CREATE TABLE "Messages" (
    "id" SERIAL PRIMARY KEY,
    "senderId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "senderName" VARCHAR(255) NOT NULL,
    "receiverId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "text" TEXT,
    "image" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 4. Initial Seed Data Insertions (Default credentials: password123)
-- ====================================================================

-- Users Seed (Pre-hashed bcrypt passwords for default accounts)
INSERT INTO "Users" ("id", "username", "email", "password", "role", "referralCode", "balance", "referralEarnings", "createdAt", "updatedAt") VALUES
(1, 'ishimwe', 'ishimwe@example.com', '$2b$10$rhjH2RjoiDvP35ONaRJyy.C/OKZtWZX0QAxPn6Q96sfLJPtxOZCGW', 'CEO', 'ISHIMWE_ADMIN', 0.00, 0.00, NOW(), NOW()),
(2, 'jeremie', 'jeremie@example.com', '$2b$10$4azzjBBGnqBhnDiy6gLroOvdDHwcEoZiEXIoRuI0EY8BwSqREcVXm', 'Client', 'JEREMIE_CLIENT', 0.00, 0.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Employees Seed
INSERT INTO "Employees" ("userId", "position", "salary", "hireDate", "status", "createdAt", "updatedAt") VALUES
(1, 'CEO', 0.00, CURRENT_DATE, 'Active', NOW(), NOW())
ON CONFLICT ("userId") DO UPDATE SET "status" = 'Active', "position" = 'CEO', "updatedAt" = NOW();

-- Clients Seed
INSERT INTO "Clients" ("name", "email", "status", "createdAt", "updatedAt") VALUES
('jeremie', 'jeremie@example.com', 'Active', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "status" = 'Active', "updatedAt" = NOW();

-- Reset SERIAL sequences (important for subsequent auto-increments to work properly)
SELECT setval(pg_get_serial_sequence('"Users"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "Users";
