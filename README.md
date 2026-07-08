# INVEST Project

INVEST is a full-stack web platform built to manage an investment-oriented organization from one place. It combines an admin dashboard, employee and manager tools, client/investor workflows, and finance operations in a single application.

This project is designed for companies that need to manage:
- users and roles
- employees and departments
- projects and tasks
- clients and partnerships
- finances such as revenue, expenses, budgets, payroll, deposits, and withdrawals
- announcements, reports, documents, and internal communication

---

## What this project does

In simple terms, INVEST helps a company run its internal operations and investor-facing activities through one system.

### Main business areas
- Authentication and user management
- Admin and manager dashboards
- Employee and task tracking
- Project and client management
- Finance and wallet operations
- Communication tools such as announcements and chat
- Reports and document management

---

## Who is this system for?

This application is useful for:
- company administrators
- managers and team leads
- employees
- clients or investors
- finance and operations teams

---

## Project overview

The application is split into two main parts:

1. Frontend
   - A modern React web application
   - Used by users to log in, view dashboards, manage work, and interact with the system
   - Built with Vite, React Router, Tailwind CSS, Zustand, and Recharts

2. Backend
   - A Node.js and Express API server
   - Handles authentication, business logic, database access, notifications, and file uploads
   - Uses PostgreSQL through Sequelize

---

## Main features

### 1. User and role management
- user registration and login
- role-based access for CEO, Chairman, Admin, Manager, Employee, Client, and other users
- secure authentication with JWT and refresh tokens
- optional two-factor authentication support

### 2. Dashboard experience
- admin dashboard with statistics and overview reports
- manager dashboard for team and operations monitoring
- user dashboard for regular users and clients

### 3. Company operations
- employee and department management
- project creation and tracking
- task assignment and completion
- attendance and leave management
- announcements and internal updates

### 4. Finance and investment features
- revenue and expense tracking
- budget management
- payroll handling
- deposit and withdrawal workflows
- investment-related transactions and reporting

### 5. Communication and collaboration
- internal chat and messaging
- referral management
- document upload and management
- real-time updates through Socket.IO

---

## Technology stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Zustand
- Recharts
- Axios
- Socket.IO client

### Backend
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL
- JWT authentication
- Nodemailer for emails
- Twilio for SMS (optional)
- Swagger for API documentation
- Socket.IO for real-time features

---

## Project structure

```text
INVEST/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── config/
│   │   └── utils/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── store/
│   │   └── data/
│   └── package.json
├── package.json
└── README.md
```

---

## Getting started

### 1. Install dependencies
From the project root, run:

```bash
npm run install:all
```

This installs dependencies for the root project, frontend, and backend.

### 2. Configure environment variables
The backend uses environment variables for the database, JWT secrets, email, and other services.

Copy the example file:

```bash
cp backend/.env.example backend/.env
```

Then update the values in backend/.env with your own settings.

### 3. Start the application
From the project root:

```bash
npm run dev
```

This starts the frontend and backend together.

---

## Backend commands

Inside the backend folder, common commands are:

```bash
npm run dev
npm run start
npm run migrate
npm run seed
npm test
```

---

## Frontend commands

Inside the frontend folder:

```bash
npm run dev
npm run build
npm run preview
```

---

## API documentation

When the backend is running, API documentation is available at:

```text
http://localhost:5000/api/docs
```

You can also check the server health at:

```text
http://localhost:5000/api/health
```

---

## Environment variables

The backend expects values such as:
- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- CLIENT_URL
- SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
- PORT
- NODE_ENV

A full example is provided in backend/.env.example.

---

## Deployment notes

This repository includes deployment configuration files for common platforms such as Render, Vercel, and Zeabur. In production, make sure:
- your database is properly configured
- environment variables are set securely
- the app is run with the correct production settings

---

## Summary

INVEST is a complete business and investment management platform that brings together administration, employee operations, project tracking, finance, and communication in one modern application. It is suitable for organizations that want a centralized system to manage internal work and investor-related processes efficiently.

If you are new to the project, the easiest way to understand it is to think of it as:
- a company dashboard
- an internal operations portal
- an investor and finance management system
- a full-stack web application with a React frontend and an Express backend
