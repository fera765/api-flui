import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnly__ } from '@modules/core/routes';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Models API - /api/models', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    __testOnly__.clearRepository();
  });

  describe('GET /api/models', () => {
    it('should return list of models from configured endpoint', async () => {
      // Setup configuration
      await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://test.api.com/v1',
          apiKey: 'test-key',
          model: 'gpt-4',
        });

      // Mock axios response
      const mockModels = {
        data: [
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        ],
      };
      mockedAxios.get.mockResolvedValue({ data: mockModels });

      const response = await request(app).get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockModels);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/v1/models',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-key',
          },
        })
      );
    });

    it('should use default endpoint when no configuration is set', async () => {
      const mockModels = {
        data: [{ id: 'default-model', name: 'Default Model' }],
      };
      mockedAxios.get.mockResolvedValue({ data: mockModels });

      const response = await request(app).get('/api/models');

      expect(response.status).toBe(200);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.llm7.io/v1/models',
        {}
      );
    });

    it('should make request without Authorization header when apiKey is not set', async () => {
      await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://test.api.com/v1',
          model: 'gpt-4',
        });

      const mockModels = { data: [] };
      mockedAxios.get.mockResolvedValue({ data: mockModels });

      await request(app).get('/api/models');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/v1/models',
        expect.not.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });

    it('should return 500 when external API request fails', async () => {
      await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://invalid.api.com/v1',
          model: 'gpt-4',
        });

      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const response = await request(app).get('/api/models');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle API error responses properly', async () => {
      await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://test.api.com/v1',
          apiKey: 'invalid-key',
          model: 'gpt-4',
        });

      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      });

      const response = await request(app).get('/api/models');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});
