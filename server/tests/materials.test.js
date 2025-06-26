const request = require('supertest');
const express = require('express');
const { validate, validateQuery } = require('../middleware/validation');
const { createMaterialSchema, materialFiltersSchema, updateStockSchema } = require('../schemas/materialSchemas');

describe('Materials API Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock endpoints z walidacją
    app.post('/api/materials', validate(createMaterialSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });

    app.get('/api/materials', validateQuery(materialFiltersSchema), (req, res) => {
      res.json({ success: true, query: req.query });
    });

    app.patch('/api/materials/:id/quantity', validate(updateStockSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  describe('POST /api/materials', () => {
    test('should accept valid material data', async () => {
      const validMaterial = {
        name: 'Cement Portland',
        unit: 'KG',
        companyId: 'company-123',
        category: 'Building Materials',
        supplier: 'ABC Supplier',
        price: 25.50,
        currentStock: 100,
        minStock: 10
      };

      const response = await request(app)
        .post('/api/materials')
        .send(validMaterial)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Cement Portland');
    });

    test('should reject material without name', async () => {
      const invalidMaterial = {
        unit: 'KG',
        companyId: 'company-123'
      };

      const response = await request(app)
        .post('/api/materials')
        .send(invalidMaterial)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject material without unit', async () => {
      const invalidMaterial = {
        name: 'Cement Portland',
        companyId: 'company-123'
      };

      const response = await request(app)
        .post('/api/materials')
        .send(invalidMaterial)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject material without companyId', async () => {
      const invalidMaterial = {
        name: 'Cement Portland',
        unit: 'KG'
      };

      const response = await request(app)
        .post('/api/materials')
        .send(invalidMaterial)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject material with invalid unit', async () => {
      const invalidMaterial = {
        name: 'Cement Portland',
        unit: 'INVALID_UNIT',
        companyId: 'company-123'
      };

      const response = await request(app)
        .post('/api/materials')
        .send(invalidMaterial)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject material with negative price', async () => {
      const invalidMaterial = {
        name: 'Cement Portland',
        unit: 'KG',
        companyId: 'company-123',
        price: -10
      };

      const response = await request(app)
        .post('/api/materials')
        .send(invalidMaterial)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/materials (query validation)', () => {
    test('should accept valid query parameters', async () => {
      const response = await request(app)
        .get('/api/materials')
        .query({
          companyId: 'company-123',
          category: 'Building Materials',
          lowStock: true,
          page: 1,
          limit: 20
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject negative page number', async () => {
      const response = await request(app)
        .get('/api/materials')
        .query({
          page: -1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject too high limit', async () => {
      const response = await request(app)
        .get('/api/materials')
        .query({
          limit: 500 // max 100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/materials/:id/quantity', () => {
    test('should accept valid stock update', async () => {
      const validStockUpdate = {
        quantity: 50,
        type: 'ADD',
        reason: 'New delivery received'
      };

      const response = await request(app)
        .patch('/api/materials/material-123/quantity')
        .send(validStockUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(50);
    });

    test('should reject stock update without quantity', async () => {
      const invalidUpdate = {
        type: 'ADD',
        reason: 'New delivery'
      };

      const response = await request(app)
        .patch('/api/materials/material-123/quantity')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject stock update without type', async () => {
      const invalidUpdate = {
        quantity: 50,
        reason: 'New delivery'
      };

      const response = await request(app)
        .patch('/api/materials/material-123/quantity')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid stock operation type', async () => {
      const invalidUpdate = {
        quantity: 50,
        type: 'MULTIPLY', // nie istnieje
        reason: 'Invalid operation'
      };

      const response = await request(app)
        .patch('/api/materials/material-123/quantity')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
