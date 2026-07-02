const request = require('supertest');
const app = require('../app');

describe('App fallback routes', () => {
  it('should return a JSON status response for the root endpoint', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'INVEST backend API');
  });
});
