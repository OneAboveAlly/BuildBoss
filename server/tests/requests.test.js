const request = require('supertest');
const express = require('express');
const { validate, validateQuery } = require('../middleware/validation');
const { createRequestSchema, updateRequestSchema, requestFiltersSchema } = require('../schemas/requestSchemas');

describe('Requests API Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock endpoints z walidacją
    app.post('/api/requests', validate(createRequestSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });

    app.put('/api/requests/:id', validate(updateRequestSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });

    app.get('/api/requests', validateQuery(requestFiltersSchema), (req, res) => {
      res.json({ success: true, query: req.query });
    });
  });

  describe('POST /api/requests', () => {
    test('should accept valid work request data', async () => {
      const validRequest = {
        title: 'Remont łazienki w domu jednorodzinnym',
        description: 'Poszukujemy fachowców do kompleksowego remontu łazienki. Zakres obejmuje: demo, instalacje, płytki, malowanie.',
        category: 'RENOVATION',
        type: 'ONE_TIME',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        address: 'ul. Przykładowa 123',
        budgetMin: 5000,
        budgetMax: 8000,
        currency: 'PLN',
        deadline: '2025-12-31',
        requirements: ['Doświadczenie min. 3 lata', 'Referencje', 'Własne narzędzia'],
        materials: [],
        contactEmail: 'test@example.com',
        contactPhone: '+48 123 456 789'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(validRequest)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Remont łazienki w domu jednorodzinnym');
    });

    test('should reject request without title', async () => {
      const invalidRequest = {
        description: 'Opis zlecenia',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie',
        city: 'Warszawa'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request without description', async () => {
      const invalidRequest = {
        title: 'Test Request',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie',
        city: 'Warszawa'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request with invalid category', async () => {
      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'INVALID_CATEGORY',
        voivodeship: 'mazowieckie',
        city: 'Warszawa'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request with invalid voivodeship', async () => {
      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'RENOVATION',
        voivodeship: 'invalid-voivodeship',
        city: 'Warszawa'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request without city', async () => {
      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request with invalid email format', async () => {
      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        contactEmail: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request when budgetMax is less than budgetMin', async () => {
      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        budgetMin: 10000,
        budgetMax: 5000
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request with deadline in the past', async () => {
      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        deadline: '2020-01-01'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request with too many requirements', async () => {
      const requirements = Array(31).fill('Requirement');

      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        requirements
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject request with too many materials', async () => {
      const materials = Array(51).fill({ name: 'Material', quantity: 1 });

      const invalidRequest = {
        title: 'Test Request',
        description: 'Opis zlecenia wystarczająco długi',
        category: 'RENOVATION',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        materials
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/requests/:id', () => {
    test('should accept valid request update data', async () => {
      const validUpdate = {
        title: 'Updated Request Title',
        budgetMin: 6000,
        budgetMax: 9000,
        isActive: false
      };

      const response = await request(app)
        .put('/api/requests/request-123')
        .send(validUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Request Title');
    });

    test('should reject update with invalid category', async () => {
      const invalidUpdate = {
        category: 'INVALID_CATEGORY'
      };

      const response = await request(app)
        .put('/api/requests/request-123')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject update with invalid budget range', async () => {
      const invalidUpdate = {
        budgetMin: 15000,
        budgetMax: 10000
      };

      const response = await request(app)
        .put('/api/requests/request-123')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/requests (filters validation)', () => {
    test('should accept valid filter parameters', async () => {
      const response = await request(app)
        .get('/api/requests')
        .query({
          category: 'RENOVATION',
          voivodeship: 'mazowieckie',
          city: 'Warszawa',
          type: 'ONE_TIME',
          budgetMin: 5000,
          budgetMax: 15000,
          search: 'łazienka',
          sortBy: 'title',
          sortOrder: 'asc',
          page: 2,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid category filter', async () => {
      const response = await request(app)
        .get('/api/requests')
        .query({
          category: 'INVALID_CATEGORY'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/requests')
        .query({
          sortBy: 'invalid_field'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject limit exceeding maximum', async () => {
      const response = await request(app)
        .get('/api/requests')
        .query({
          limit: 500 // max 100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject negative page number', async () => {
      const response = await request(app)
        .get('/api/requests')
        .query({
          page: -1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 