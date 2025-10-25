import request from 'supertest';
import { app } from '@infra/http/app';

describe('Health Check - GET /', () => {
  it('should return 200 and a success message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'API is running');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return a valid timestamp', async () => {
    const response = await request(app).get('/');

    expect(response.body.timestamp).toBeDefined();
    expect(typeof response.body.timestamp).toBe('string');
    expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
