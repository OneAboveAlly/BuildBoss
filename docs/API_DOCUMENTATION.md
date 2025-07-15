# 📚 BuildBoss API Documentation

Complete API documentation for BuildBoss SaaS platform using OpenAPI 3.0 specification.

## 🔗 Access Documentation

### Live Documentation
- **Development**: http://localhost:5000/api-docs
- **Production**: https://api.buildboss.eu/api-docs

### Documentation Features
- ✅ Interactive Swagger UI interface
- ✅ Try-it-out functionality for testing endpoints
- ✅ Complete request/response schemas
- ✅ Authentication examples
- ✅ Error handling documentation
- ✅ Rate limiting information

## 📋 Available Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/confirm/:token` - Email confirmation
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### 👥 Users
- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### 🏢 Companies
- `GET /api/companies` - List companies (paginated)
- `POST /api/companies` - Create new company
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `POST /api/companies/:id/invite` - Invite worker to company
- `GET /api/companies/:id/workers` - List company workers

### 📂 Projects
- `GET /api/projects` - List projects (paginated)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/tasks` - List project tasks
- `GET /api/projects/:id/materials` - List project materials

### ✅ Tasks
- `GET /api/tasks` - List tasks (paginated)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/assign` - Assign task to user
- `GET /api/tasks/my` - Get current user's tasks

### 🧱 Materials
- `GET /api/materials` - List materials (paginated)
- `POST /api/materials` - Create new material
- `GET /api/materials/:id` - Get material details
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material
- `POST /api/materials/:id/stock` - Update stock levels
- `GET /api/materials/low-stock` - Get low stock alerts

### 💼 Jobs
- `GET /api/jobs` - List job offers (paginated)
- `POST /api/jobs` - Create job offer
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job offer
- `DELETE /api/jobs/:id` - Delete job offer
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/:id/applications` - List job applications

### 📨 Messages
- `GET /api/messages` - List conversations
- `POST /api/messages` - Send new message
- `GET /api/messages/:conversationId` - Get conversation messages
- `PUT /api/messages/:id/read` - Mark message as read

### 🔔 Notifications
- `GET /api/notifications` - List notifications (paginated)
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

### 📊 Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/projects/:id` - Project analytics
- `GET /api/analytics/tasks` - Task completion analytics
- `GET /api/analytics/materials` - Material usage analytics

### 📈 Reports
- `GET /api/reports` - List available reports
- `POST /api/reports/generate` - Generate custom report
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/:id/download` - Download report file

### 🔍 Search
- `GET /api/search` - Global search across all entities
- `GET /api/search/projects` - Search projects
- `GET /api/search/tasks` - Search tasks
- `GET /api/search/materials` - Search materials

### 💳 Subscriptions
- `GET /api/subscriptions` - List subscription plans
- `POST /api/subscriptions/subscribe` - Create subscription
- `GET /api/subscriptions/current` - Get current subscription
- `PUT /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/webhook` - Stripe webhook handler

### 🏥 Health Monitoring
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system health
- `GET /api/health/database` - Database connectivity check
- `GET /api/health/system` - System resources check

### ⚖️ Legal & GDPR
- `GET /api/legal/terms` - Terms of service
- `GET /api/legal/privacy` - Privacy policy
- `POST /api/gdpr/export` - Request data export
- `POST /api/gdpr/delete` - Request account deletion

## 🔧 API Configuration

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.buildboss.eu/api`

### Content Type
All API endpoints accept and return JSON data:
```
Content-Type: application/json
```

### Authentication
Most endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

Obtain token via `/api/auth/login` endpoint.

### Rate Limiting
- **Standard endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File uploads**: 10 requests per 15 minutes

### Pagination
List endpoints support pagination parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sort` - Sort field and direction (e.g., "createdAt:desc")
- `search` - Search query string

Response format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 📝 Schema Definitions

### Core Entities

#### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "SUPERADMIN|ADMIN|USER",
  "isActive": true,
  "emailVerified": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Company
```json
{
  "id": "uuid",
  "name": "Construction Co.",
  "description": "Professional construction services",
  "website": "https://example.com",
  "phone": "+48123456789",
  "address": "Main Street 123",
  "city": "Warsaw",
  "country": "Poland",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Project
```json
{
  "id": "uuid",
  "name": "Office Building Construction",
  "description": "Modern office building project",
  "status": "PLANNING|ACTIVE|ON_HOLD|COMPLETED|CANCELLED",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "budget": 1000000.00,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Task
```json
{
  "id": "uuid",
  "title": "Install electrical wiring",
  "description": "Install electrical wiring for first floor",
  "status": "TODO|IN_PROGRESS|REVIEW|DONE|CANCELLED",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "dueDate": "2025-01-15T10:00:00Z",
  "estimatedHours": 8.5,
  "actualHours": 7.2,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Material
```json
{
  "id": "uuid",
  "name": "Steel Rebar",
  "description": "High-strength steel reinforcement bars",
  "category": "Steel & Metal",
  "unit": "kg",
  "currentStock": 1500.0,
  "minStock": 100.0,
  "unitPrice": 2.50,
  "supplier": "Steel Supplier Ltd",
  "location": "Warehouse A",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## 🚨 Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "JWT token is missing or invalid"
}
```

### Rate Limit Errors
```json
{
  "error": "Too many requests",
  "retryAfter": 60
}
```

## 🧪 Testing the API

### Using Swagger UI
1. Navigate to `/api-docs`
2. Click "Authorize" button
3. Enter your JWT token
4. Try out any endpoint

### Using cURL Examples

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Get Projects (Authenticated)
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Create Project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Construction Project",
    "description": "Modern residential building",
    "priority": "HIGH",
    "startDate": "2025-02-01",
    "budget": 500000
  }'
```

## 🔄 Development Workflow

### Adding New Endpoints
1. Create route handler in `/routes/*.js`
2. Add JSDoc documentation with `@swagger` tags
3. Define request/response schemas
4. Test endpoint functionality
5. Verify documentation appears in Swagger UI

### JSDoc Documentation Example
```javascript
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List projects
 *     description: Get paginated list of projects
 *     tags: [Projects]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
```

## 📚 Additional Resources

### Documentation Files
- `config/swagger.js` - OpenAPI configuration
- `server/server.js` - Swagger UI setup
- `routes/*.js` - Endpoint implementations with JSDoc

### External Documentation
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JSDoc @swagger Tags](https://swagger-jsdoc.github.io/docs/)

### Support
- **Technical Issues**: Create issue in GitHub repository
- **API Questions**: Contact dev@buildboss.eu
- **Feature Requests**: Submit via GitHub issues

---

**BuildBoss API Documentation** - Comprehensive REST API for construction project management.

*Last updated: 2025-06-26* 