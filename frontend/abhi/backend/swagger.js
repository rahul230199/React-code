const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AXO Dashboard API',
      version: '1.0.0',
      description: 'AXO Platform Backend APIs'
    },
    servers: [
      { url: 'http://localhost:3001' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./backend/routes/*.js']
};

module.exports = swaggerJSDoc(options);
