const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mock app dla testów
const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'SiteBoss Server is running!',
      timestamp: new Date().toISOString(),
      environment: 'test'
    });
  });
  
  return app;
};

describe('Health Check API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });

  test('GET /api/health should return OK status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'OK',
      message: 'SiteBoss Server is running!',
      environment: 'test'
    });
    
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /api/health should return JSON content type', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });
}); 