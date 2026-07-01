const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise Management System API',
      version: '1.0.0',
      description: 'Production-Ready Backend API for EMS, including Authentication, CEO Dashboard, Employee Management, Projects, Finances, Sockets, and Security Logs.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Scan routes for JSDoc documentation
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
