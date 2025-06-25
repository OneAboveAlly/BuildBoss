const { validate } = require('../middleware/validation');
const { registerSchema } = require('../schemas/authSchemas');
const express = require('express');
const request = require('supertest');

describe('Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Test endpoint z walidacją
    app.post('/test', validate(registerSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  describe('Valid data', () => {
    test('should pass validation with valid registration data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        firstName: 'Jan',
        lastName: 'Kowalski'
      };

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('Invalid data', () => {
    test('should reject invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'StrongPassword123!',
        firstName: 'Jan',
        lastName: 'Kowalski'
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
      expect(response.body.errors).toBeDefined();
    });

    test('should reject weak password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Jan',
        lastName: 'Kowalski'
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    test('should reject missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // brak password, firstName, lastName
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    test('should reject empty firstName', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        firstName: '',
        lastName: 'Kowalski'
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 