import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import path from 'path';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexora ERP API',
      version: '1.0.0',
      description: 'Auto‑generated Swagger documentation for the Nexora ERP backend',
    },
    servers: [{ url: `http://localhost:${config.port}/api`, description: 'Local dev server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        StudentCreate: {
          type: 'object',
          required: ['name', 'email', 'password', 'admissionNo', 'classId'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
            admissionNo: { type: 'string' },
            classId: { type: 'string' },
            dob: { type: 'string', format: 'date' },
            meta: { type: 'object' },
          },
        },
        StudentUpdate: {
          type: 'object',
          properties: {
            admissionNo: { type: 'string' },
            classId: { type: 'string' },
            dob: { type: 'string', format: 'date' },
            meta: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.resolve(__dirname, '../routes/*.ts'), path.resolve(__dirname, '../controllers/*.ts')],
} as const;

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export const swaggerUiMiddleware = swaggerUi;
