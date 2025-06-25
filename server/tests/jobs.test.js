const request = require('supertest');
const express = require('express');
const { validate, validateQuery } = require('../middleware/validation');
const { createJobSchema, updateJobSchema, jobFiltersSchema, applyJobSchema } = require('../schemas/jobSchemas');

describe('Jobs API Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock endpoints z walidacją
    app.post('/api/jobs', validate(createJobSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });

    app.put('/api/jobs/:id', validate(updateJobSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });

    app.get('/api/jobs', validateQuery(jobFiltersSchema), (req, res) => {
      res.json({ success: true, query: req.query });
    });

    app.post('/api/jobs/:id/apply', validate(applyJobSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  describe('POST /api/jobs', () => {
    test('should accept valid job offer data', async () => {
      const validJob = {
        title: 'Senior React Developer',
        description: 'Szukamy doświadczonego developera React do naszego zespołu. Oferujemy ciekawe projekty i rozwój.',
        category: 'ENGINEER',
        type: 'FULL_TIME',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        address: 'ul. Testowa 123',
        salaryMin: 8000,
        salaryMax: 12000,
        currency: 'PLN',
        experience: 'SENIOR',
        requirements: ['React', 'TypeScript', 'Node.js'],
        benefits: ['Praca zdalna', 'Prywatna opieka medyczna'],
        contactEmail: 'hr@example.com',
        contactPhone: '+48 123 456 789',
        companyId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(validJob)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Senior React Developer');
    });

    test('should reject job without title', async () => {
      const invalidJob = {
        description: 'Opis stanowiska',
        category: 'ENGINEER',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        companyId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(invalidJob)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject job without description', async () => {
      const invalidJob = {
        title: 'Test Job',
        category: 'ENGINEER',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        companyId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(invalidJob)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject job with invalid category', async () => {
      const invalidJob = {
        title: 'Test Job',
        description: 'Opis stanowiska wystarczająco długi',
        category: 'INVALID_CATEGORY',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        companyId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(invalidJob)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject job with invalid voivodeship', async () => {
      const invalidJob = {
        title: 'Test Job',
        description: 'Opis stanowiska wystarczająco długi',
        category: 'ENGINEER',
        voivodeship: 'invalid-voivodeship',
        city: 'Warszawa',
        companyId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(invalidJob)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject job without companyId', async () => {
      const invalidJob = {
        title: 'Test Job',
        description: 'Opis stanowiska wystarczająco długi',
        category: 'ENGINEER',
        voivodeship: 'mazowieckie',
        city: 'Warszawa'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(invalidJob)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject job with invalid email format', async () => {
      const invalidJob = {
        title: 'Test Job',
        description: 'Opis stanowiska wystarczająco długi',
        category: 'ENGINEER',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        contactEmail: 'invalid-email',
        companyId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(invalidJob)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject job when salaryMax is less than salaryMin', async () => {
      const invalidJob = {
        title: 'Test Job',
        description: 'Opis stanowiska wystarczająco długi',
        category: 'ENGINEER',
        voivodeship: 'mazowieckie',
        city: 'Warszawa',
        salaryMin: 10000,
        salaryMax: 5000,
        companyId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(invalidJob)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/jobs/:id', () => {
    test('should accept valid job update data', async () => {
      const validUpdate = {
        title: 'Updated Job Title',
        salaryMin: 9000,
        salaryMax: 13000,
        isActive: false
      };

      const response = await request(app)
        .put('/api/jobs/job-123')
        .send(validUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Job Title');
    });

    test('should reject update with invalid category', async () => {
      const invalidUpdate = {
        category: 'INVALID_CATEGORY'
      };

      const response = await request(app)
        .put('/api/jobs/job-123')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject update with invalid salary range', async () => {
      const invalidUpdate = {
        salaryMin: 15000,
        salaryMax: 10000
      };

      const response = await request(app)
        .put('/api/jobs/job-123')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/jobs (filters validation)', () => {
    test('should accept valid filter parameters', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({
          category: 'ENGINEER',
          voivodeship: 'mazowieckie',
          city: 'Warszawa',
          type: 'FULL_TIME',
          experience: 'SENIOR',
          salaryMin: 5000,
          salaryMax: 15000,
          search: 'React',
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
        .get('/api/jobs')
        .query({
          category: 'INVALID_CATEGORY'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({
          sortBy: 'invalid_field'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject limit exceeding maximum', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({
          limit: 500 // max 100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject negative page number', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({
          page: -1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/jobs/:id/apply', () => {
    test('should accept valid job application', async () => {
      const validApplication = {
        message: 'Jestem zainteresowany tą ofertą pracy. Mam 5 lat doświadczenia w React.',
        cvUrl: 'https://example.com/cv.pdf',
        portfolioUrl: 'https://example.com/portfolio',
        expectedSalary: 10000,
        availableFrom: '2024-01-01'
      };

      const response = await request(app)
        .post('/api/jobs/job-123/apply')
        .send(validApplication)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject application with too short message', async () => {
      const invalidApplication = {
        message: 'Short'
      };

      const response = await request(app)
        .post('/api/jobs/job-123/apply')
        .send(invalidApplication)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject application with invalid CV URL', async () => {
      const invalidApplication = {
        message: 'Valid message length here',
        cvUrl: 'not-a-valid-url'
      };

      const response = await request(app)
        .post('/api/jobs/job-123/apply')
        .send(invalidApplication)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject application with negative salary', async () => {
      const invalidApplication = {
        message: 'Valid message length here',
        expectedSalary: -5000
      };

      const response = await request(app)
        .post('/api/jobs/job-123/apply')
        .send(invalidApplication)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 
