const request = require('supertest');
const express = require('express');
const { validate } = require('../middleware/validation');
const { createMessageSchema } = require('../schemas/messageSchemas');

describe('Messages API Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock endpoint z walidacją
    app.post('/api/messages', validate(createMessageSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  describe('POST /api/messages', () => {
    test('should accept valid message data', async () => {
      const validMessage = {
        content: 'Cześć! Czy oferta pracy jest nadal aktualna?',
        receiverId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'DIRECT',
        priority: 'NORMAL'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(validMessage)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Cześć! Czy oferta pracy jest nadal aktualna?');
    });

    test('should reject message without content', async () => {
      const invalidMessage = {
        receiverId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject message without receiverId', async () => {
      const invalidMessage = {
        content: 'Cześć! Jak się masz?'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject message with invalid receiverId format', async () => {
      const invalidMessage = {
        content: 'Cześć! Jak się masz?',
        receiverId: 'invalid-uuid'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject message with too long content', async () => {
      const invalidMessage = {
        content: 'A'.repeat(5001), // Ponad limit 5000 znaków
        receiverId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject message with invalid type', async () => {
      const invalidMessage = {
        content: 'Test message',
        receiverId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject message with invalid priority', async () => {
      const invalidMessage = {
        content: 'Test message',
        receiverId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'INVALID_PRIORITY'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should accept message with attachments', async () => {
      const validMessage = {
        content: 'Oto moje CV w załączniku',
        receiverId: '123e4567-e89b-12d3-a456-426614174000',
        attachments: [
          {
            filename: 'cv.pdf',
            url: 'https://example.com/cv.pdf',
            size: 1024000,
            mimeType: 'application/pdf'
          }
        ]
      };

      const response = await request(app)
        .post('/api/messages')
        .send(validMessage)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attachments).toHaveLength(1);
    });

    test('should reject message with too many attachments', async () => {
      const attachments = Array(11).fill({
        filename: 'file.pdf',
        url: 'https://example.com/file.pdf'
      });

      const invalidMessage = {
        content: 'Test message',
        receiverId: '123e4567-e89b-12d3-a456-426614174000',
        attachments
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
