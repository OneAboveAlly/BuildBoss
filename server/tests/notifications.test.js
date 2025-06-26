const request = require('supertest');
const express = require('express');
const { validate, validateParams, validateQuery } = require('../middleware/validation');
const { notificationFiltersSchema, testNotificationSchema } = require('../schemas/notificationSchemas');
const { idSchema } = require('../schemas/commonSchemas');

describe('Notifications API Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock endpoints z walidacją
    app.get('/api/notifications', validateQuery(notificationFiltersSchema), (req, res) => {
      res.json({ success: true, query: req.query });
    });

    app.put('/api/notifications/:id/read', validateParams(idSchema), (req, res) => {
      res.json({ success: true, id: req.params.id });
    });

    app.delete('/api/notifications/:id', validateParams(idSchema), (req, res) => {
      res.json({ success: true, id: req.params.id });
    });

    app.post('/api/notifications/test', validate(testNotificationSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  describe('GET /api/notifications (filters validation)', () => {
    test('should accept valid filter parameters', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({
          page: 2,
          limit: 50,
          unreadOnly: 'true'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query.page).toBe('2');
      expect(response.body.query.limit).toBe('50');
      expect(response.body.query.unreadOnly).toBe('true');
    });

    test('should use default values when parameters not provided', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject negative page number', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({
          page: -1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject page number 0', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({
          page: 0
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject limit exceeding maximum', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({
          limit: 500 // max 100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject negative limit', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({
          limit: -10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid unreadOnly value', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({
          unreadOnly: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    test('should accept valid UUID parameter', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .put(`/api/notifications/${validUuid}/read`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(validUuid);
    });

    test('should reject invalid UUID format', async () => {
      const response = await request(app)
        .put('/api/notifications/invalid-uuid/read')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject empty ID parameter', async () => {
      const response = await request(app)
        .put('/api/notifications//read')
        .expect(404); // Express router behavior for empty param

      // This test verifies the route doesn't match
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    test('should accept valid UUID parameter', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .delete(`/api/notifications/${validUuid}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(validUuid);
    });

    test('should reject invalid UUID format', async () => {
      const response = await request(app)
        .delete('/api/notifications/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should accept numeric ID (alfanumeryczne)', async () => {
      const response = await request(app)
        .delete('/api/notifications/12345')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/notifications/test', () => {
    test('should accept valid test notification data', async () => {
      const validNotification = {
        type: 'SYSTEM_UPDATE',
        title: 'Test Notification',
        message: 'This is a test notification message',
        data: { testFlag: true, userId: '123' }
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .send(validNotification)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('SYSTEM_UPDATE');
      expect(response.body.data.title).toBe('Test Notification');
    });

    test('should use default values when optional fields not provided', async () => {
      const minimalNotification = {
        title: 'Test Title',
        message: 'Test Message'
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .send(minimalNotification)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Title');
      expect(response.body.data.message).toBe('Test Message');
    });

    test('should accept all valid notification types', async () => {
      const validTypes = [
        'TASK_ASSIGNED', 'TASK_COMPLETED', 'MESSAGE_RECEIVED', 
        'MATERIAL_LOW', 'SYSTEM_UPDATE', 'COMPANY_INVITE',
        'PROJECT_UPDATE', 'DEADLINE_REMINDER'
      ];

      for (const type of validTypes) {
        const notification = {
          type,
          title: `Test ${type}`,
          message: 'Test message'
        };

        const response = await request(app)
          .post('/api/notifications/test')
          .send(notification)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe(type);
      }
    });

    test('should reject invalid notification type', async () => {
      const invalidNotification = {
        type: 'INVALID_TYPE',
        title: 'Test Notification',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .send(invalidNotification)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject title exceeding maximum length', async () => {
      const longTitle = 'A'.repeat(201); // Max is 200

      const invalidNotification = {
        title: longTitle,
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .send(invalidNotification)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject message exceeding maximum length', async () => {
      const longMessage = 'A'.repeat(1001); // Max is 1000

      const invalidNotification = {
        title: 'Test Title',
        message: longMessage
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .send(invalidNotification)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should accept complex data object', async () => {
      const complexNotification = {
        type: 'TASK_ASSIGNED',
        title: 'Complex Notification',
        message: 'Test with complex data',
        data: {
          taskId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Test Project',
          deadline: '2025-12-31',
          assignedBy: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          metadata: {
            priority: 'HIGH',
            tags: ['urgent', 'critical']
          }
        }
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .send(complexNotification)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data.taskId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(response.body.data.data.assignedBy.name).toBe('John Doe');
    });
  });
}); 