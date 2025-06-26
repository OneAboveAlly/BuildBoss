const request = require('supertest');
const express = require('express');
const { validate, validateQuery } = require('../middleware/validation');
const { createTaskSchema, taskFiltersSchema } = require('../schemas/taskSchemas');

describe('Tasks API Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock endpoints z walidacją
    app.post('/api/tasks', validate(createTaskSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });

    app.get('/api/tasks', validateQuery(taskFiltersSchema), (req, res) => {
      res.json({ success: true, query: req.query });
    });
  });

  describe('POST /api/tasks', () => {
    test('should accept valid task data', async () => {
      const validTask = {
        title: 'Test Task',
        description: 'Test description',
        projectId: 'project-123',
        priority: 'HIGH'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(validTask)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task');
    });

    test('should reject task without title', async () => {
      const invalidTask = {
        description: 'Test description',
        projectId: 'project-123',
        priority: 'HIGH'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject task with invalid priority', async () => {
      const invalidTask = {
        title: 'Test Task',
        projectId: 'project-123',
        priority: 'INVALID_PRIORITY'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject task with too short title', async () => {
      const invalidTask = {
        title: 'A', // za krótki
        projectId: 'project-123'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject task without projectId', async () => {
      const invalidTask = {
        title: 'Test Task',
        description: 'Test description'
        // brak projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks (query validation)', () => {
    test('should accept valid query parameters', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          projectId: 'project-123',
          status: 'TODO',
          priority: 'HIGH',
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid status', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          status: 'INVALID_STATUS'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid priority', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          priority: 'SUPER_HIGH' // nie istnieje
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject negative page number', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          page: -1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject too high limit', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          limit: 1000 // max 100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
