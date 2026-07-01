# Production-Ready Node.js Backend

Enterprise Management System (EMS) backend application built with Express, Sequelize ORM, PostgreSQL, Socket.io, Swagger, and Joi validations.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database ORM:** PostgreSQL & Sequelize
- **Authentication:** JWT (Access & Refresh tokens) & 2FA (TOTP)
- **Role-Based Access Control (RBAC):** CEO, Chairman, Project Manager, Finance Manager, Operations Manager, HR Manager, Staff, Client
- **Real-Time updates:** Socket.IO
- **Email/SMS triggers:** Nodemailer & Twilio
- **API Docs:** Swagger UI

---

## Folder Structure
```
backend/
├── src/
│   ├── config/          # Sequelize, mailer, SMS, Swagger setups
│   ├── controllers/     # MVC controller handlers
│   ├── models/          # 20 Sequelize models & associations
│   ├── routes/          # Express route bindings
│   ├── middleware/      # Auth, RBAC checking, Joi validator, error logs
│   ├── services/        # Mailer, SMS gateway, backup engines, upload limits
│   ├── utils/           # 2FA code validators
│   ├── validations/     # Joi validation schemas
│   ├── sockets/         # Socket.io room connections
│   ├── jobs/            # Automatic backup intervals
│   ├── uploads/         # Uploaded documents directory
│   └── app.js           # Express app instance
├── server.js            # Server entrypoint with automatic seeders
├── package.json
└── README.md
```

---

## Setup & Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Configure a `.env` file based on `.env.example`.

3. **Start Development Server:**
   ```bash
   npm start
   ```

4. **Access Swagger Documentation:**
   Open [http://localhost:5000/api-docs](http://localhost:5000/api-docs) in your browser.

---

## Testing

Run unit tests via Jest:
```bash
npm test
```
