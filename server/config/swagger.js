const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Basic API information
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BuildBoss API',
      version: '1.0.0',
      description: `
# BuildBoss SaaS API Documentation

Complete REST API documentation for BuildBoss - the comprehensive SaaS platform for small construction teams across Europe.

## Overview

BuildBoss provides a full-featured construction project management platform with:
- **Project Management**: Complete project lifecycle management
- **Task Management**: Kanban boards, task assignments, and tracking
- **Team Collaboration**: Company management, worker invitations, and messaging
- **Material Management**: Inventory tracking, stock alerts, and procurement
- **Job Posting**: Job offers, worker applications, and hiring workflows
- **Analytics & Reporting**: Comprehensive business insights and reporting
- **Multi-language Support**: EN, PL, DE, UA localization
- **Subscription Management**: Stripe integration with multiple tiers

## Authentication

All protected endpoints require a valid JWT token obtained through login:

\`\`\`http
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API endpoints are rate limited:
- **Standard endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File uploads**: 10 requests per 15 minutes

## Error Handling

The API uses standard HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error

All errors return a JSON response:
\`\`\`json
{
  "error": "Error message",
  "details": "Additional error details"
}
\`\`\`

## Contact

For technical support:
- **Email**: dev@buildboss.eu
- **GitHub**: https://github.com/buildboss/api-issues
- **Documentation**: https://docs.buildboss.eu
      `,
      contact: {
        name: 'BuildBoss Support',
        url: 'https://buildboss.eu',
        email: 'support@buildboss.eu'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://buildboss.eu/terms'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.buildboss.eu',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Unauthorized'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Resource not found'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Validation failed'
                  },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                          example: 'email'
                        },
                        message: {
                          type: 'string',
                          example: 'Must be a valid email address'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            role: {
              type: 'string',
              enum: ['SUPERADMIN', 'ADMIN', 'USER'],
              description: 'User role'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user account is active'
            },
            emailVerified: {
              type: 'boolean',
              description: 'Whether email is verified'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          },
          required: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'emailVerified', 'createdAt']
        },

        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              description: 'Company name'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Company description'
            },
            website: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'Company website URL'
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'Company phone number'
            },
            address: {
              type: 'string',
              nullable: true,
              description: 'Company address'
            },
            city: {
              type: 'string',
              nullable: true,
              description: 'Company city'
            },
            country: {
              type: 'string',
              nullable: true,
              description: 'Company country'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether company is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'name', 'isActive', 'createdAt']
        },

        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              description: 'Project name'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Project description'
            },
            status: {
              type: 'string',
              enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
              description: 'Project status'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Project priority'
            },
            startDate: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: 'Project start date'
            },
            endDate: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: 'Project end date'
            },
            budget: {
              type: 'number',
              format: 'decimal',
              nullable: true,
              description: 'Project budget'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'name', 'status', 'priority', 'createdAt']
        },

        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string',
              description: 'Task title'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Task description'
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'],
              description: 'Task status'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Task priority'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Task due date'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'title', 'status', 'priority', 'createdAt']
        },

        Material: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              description: 'Material name'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Material description'
            },
            category: {
              type: 'string',
              description: 'Material category'
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement'
            },
            currentStock: {
              type: 'number',
              format: 'decimal',
              description: 'Current stock quantity'
            },
            minStock: {
              type: 'number',
              format: 'decimal',
              description: 'Minimum stock threshold'
            },
            unitPrice: {
              type: 'number',
              format: 'decimal',
              nullable: true,
              description: 'Price per unit'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'name', 'category', 'unit', 'currentStock', 'minStock', 'createdAt']
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Companies',
        description: 'Company management operations'
      },
      {
        name: 'Projects',
        description: 'Project management operations'
      },
      {
        name: 'Tasks',
        description: 'Task management operations'
      },
      {
        name: 'Materials',
        description: 'Material and inventory management'
      },
      {
        name: 'Jobs',
        description: 'Job posting and application management'
      },
      {
        name: 'Messages',
        description: 'Internal messaging system'
      },
      {
        name: 'Notifications',
        description: 'Notification management'
      },
      {
        name: 'Analytics',
        description: 'Business analytics and insights'
      },
      {
        name: 'Reports',
        description: 'Report generation and management'
      },
      {
        name: 'Health',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './schemas/*.js',
    './server.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    filter: true,
    showRequestHeaders: true,
    docExpansion: 'none',
    deepLinking: true,
    tryItOutEnabled: true
  },
  customSiteTitle: 'BuildBoss API Documentation'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerUiOptions
};
