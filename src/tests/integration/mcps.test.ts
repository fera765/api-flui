import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnlyMCPs__ } from '@modules/core/routes/mcps.routes';

describe('MCPs API - /api/mcps', () => {
  beforeEach(() => {
    __testOnlyMCPs__.clearRepository();
  });

  afterEach(async () => {
    await __testOnlyMCPs__.cleanupSandboxes();
  });

  describe('GET /api/mcps', () => {
    it('should return empty array when no MCPs exist', async () => {
      const response = await request(app).get('/api/mcps');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all imported MCPs', async () => {
      // Import MCPs first
      await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'Pollinations MCP',
          source: '@pinkpixel/mcpollinations',
        });

      const response = await request(app).get('/api/mcps');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name', 'Pollinations MCP');
      expect(response.body[0]).toHaveProperty('source');
      expect(response.body[0]).toHaveProperty('tools');
    });
  });

  describe('POST /api/mcps/import', () => {
    it('should import MCP via NPX', async () => {
      const response = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'Pollinations MCP',
          source: '@pinkpixel/mcpollinations',
          description: 'Image and text generation',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('mcp');
      expect(response.body.mcp).toHaveProperty('id');
      expect(response.body.mcp).toHaveProperty('name', 'Pollinations MCP');
      expect(response.body.mcp).toHaveProperty('source', '@pinkpixel/mcpollinations');
      expect(response.body.mcp).toHaveProperty('sourceType', 'npx');
      expect(response.body.mcp).toHaveProperty('tools');
      expect(response.body).toHaveProperty('toolsExtracted');
      expect(response.body.toolsExtracted).toBeGreaterThan(0);
    });

    it('should import MCP via URL', async () => {
      const response = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'SSE MCP',
          source: 'https://example.com/mcp',
        });

      expect(response.status).toBe(201);
      expect(response.body.mcp).toHaveProperty('sourceType', 'url');
    });

    it('should import MCP with environment variables', async () => {
      const response = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'MCP with ENV',
          source: '@example/mcp',
          env: {
            API_KEY: 'secret-key',
            BASE_URL: 'https://api.example.com',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.mcp).toHaveProperty('env');
      expect(response.body.mcp.env).toEqual({
        API_KEY: 'secret-key',
        BASE_URL: 'https://api.example.com',
      });
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/mcps/import')
        .send({
          source: '@example/mcp',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when source is missing', async () => {
      const response = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'MCP',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/mcps/:id/tools', () => {
    it('should return all tools from MCP', async () => {
      const importResponse = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'Pollinations MCP',
          source: '@pinkpixel/mcpollinations',
        });

      const mcpId = importResponse.body.mcp.id;

      const response = await request(app).get(`/api/mcps/${mcpId}/tools`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const tool = response.body[0];
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool).toHaveProperty('outputSchema');
      expect(tool).not.toHaveProperty('executor');
    });

    it('should return 404 when MCP not found', async () => {
      const response = await request(app).get('/api/mcps/non-existent-id/tools');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/mcps/:id', () => {
    it('should delete an MCP', async () => {
      const importResponse = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'MCP to Delete',
          source: '@example/mcp',
        });

      const mcpId = importResponse.body.mcp.id;

      const response = await request(app).delete(`/api/mcps/${mcpId}`);

      expect(response.status).toBe(204);

      // Verify MCP was deleted
      const getResponse = await request(app).get(`/api/mcps/${mcpId}/tools`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when trying to delete non-existent MCP', async () => {
      const response = await request(app).delete('/api/mcps/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });
});
