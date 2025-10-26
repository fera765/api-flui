import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnlyConditions__ } from '@modules/core/routes/condition.routes';

describe('ConditionTool API - /api/tools/condition', () => {
  beforeEach(() => {
    __testOnlyConditions__.clearRepository();
  });

  describe('POST /api/tools/condition', () => {
    it('should create a condition tool with multiple conditions', async () => {
      const response = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Action Router',
          description: 'Routes based on action type',
          conditions: [
            {
              name: 'Purchase',
              predicate: 'input.action === "compra"',
              linkedNodes: ['node-1', 'node-2'],
            },
            {
              name: 'Sale',
              predicate: 'input.action === "venda"',
              linkedNodes: ['node-3'],
            },
            {
              name: 'Help',
              predicate: 'input.action === "ajuda"',
              linkedNodes: ['node-4'],
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Action Router');
      expect(response.body.type).toBe('atoom');
      expect(response.body.conditions).toHaveLength(3);
      expect(response.body.conditions[0].name).toBe('Purchase');
    });

    it('should create condition tool with complex predicates', async () => {
      const response = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Complex Router',
          conditions: [
            {
              name: 'High Value VIP',
              predicate: 'input.amount > 10000 && input.vip === true',
              linkedNodes: ['premium-flow'],
            },
            {
              name: 'Regular High Value',
              predicate: 'input.amount > 10000 && input.vip === false',
              linkedNodes: ['high-value-flow'],
            },
            {
              name: 'Standard',
              predicate: 'input.amount <= 10000',
              linkedNodes: ['standard-flow'],
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.conditions).toHaveLength(3);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/tools/condition')
        .send({
          conditions: [
            { name: 'Test', predicate: 'true', linkedNodes: [] },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should return 400 if conditions array is empty', async () => {
      const response = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Test',
          conditions: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('At least one condition is required');
    });

    it('should return 400 if condition name is missing', async () => {
      const response = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Test',
          conditions: [
            { name: '', predicate: 'true', linkedNodes: [] },
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tools/condition', () => {
    it('should return empty array when no condition tools exist', async () => {
      const response = await request(app).get('/api/tools/condition');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all condition tools', async () => {
      // Create two tools
      await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Tool 1',
          conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
        });

      await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Tool 2',
          conditions: [{ name: 'Cond2', predicate: 'true', linkedNodes: [] }],
        });

      const response = await request(app).get('/api/tools/condition');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/tools/condition/:id', () => {
    it('should return condition tool by id', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Test Tool',
          description: 'Test Description',
          conditions: [
            { name: 'Test Condition', predicate: 'input.value === 10', linkedNodes: ['node-1'] },
          ],
        });

      const toolId = createResponse.body.id;

      const response = await request(app).get(`/api/tools/condition/${toolId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(toolId);
      expect(response.body.name).toBe('Test Tool');
      expect(response.body.conditions).toHaveLength(1);
    });

    it('should return 404 when tool not found', async () => {
      const response = await request(app).get('/api/tools/condition/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('PATCH /api/tools/condition/:id', () => {
    it('should update tool name and description', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Original Name',
          description: 'Original Description',
          conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
        });

      const toolId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/tools/condition/${toolId}`)
        .send({
          name: 'Updated Name',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should update conditions', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Test Tool',
          conditions: [{ name: 'Original', predicate: 'true', linkedNodes: [] }],
        });

      const toolId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/tools/condition/${toolId}`)
        .send({
          conditions: [
            { name: 'New Cond 1', predicate: 'input.a === 1', linkedNodes: ['node-1'] },
            { name: 'New Cond 2', predicate: 'input.b === 2', linkedNodes: ['node-2'] },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.conditions).toHaveLength(2);
      expect(response.body.conditions[0].name).toBe('New Cond 1');
    });

    it('should return 404 when tool not found', async () => {
      const response = await request(app)
        .patch('/api/tools/condition/non-existent-id')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tools/condition/:id', () => {
    it('should delete condition tool', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'To Delete',
          conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
        });

      const toolId = createResponse.body.id;

      const response = await request(app).delete(`/api/tools/condition/${toolId}`);

      expect(response.status).toBe(204);

      // Verify it was deleted
      const getResponse = await request(app).get(`/api/tools/condition/${toolId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when tool not found', async () => {
      const response = await request(app).delete('/api/tools/condition/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tools/condition/:id/evaluate', () => {
    it('should evaluate condition and return first satisfied', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Action Router',
          conditions: [
            { name: 'Purchase', predicate: 'input.action === "compra"', linkedNodes: ['buy-flow'] },
            { name: 'Sale', predicate: 'input.action === "venda"', linkedNodes: ['sell-flow'] },
            { name: 'Help', predicate: 'input.action === "ajuda"', linkedNodes: ['help-flow'] },
          ],
        });

      const toolId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({
          input: { action: 'compra' },
        });

      expect(response.status).toBe(200);
      expect(response.body.satisfied).toBe(true);
      expect(response.body.conditionName).toBe('Purchase');
      expect(response.body.linkedNodes).toEqual(['buy-flow']);
    });

    it('should evaluate all conditions when evaluateAll is true', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Multi Router',
          conditions: [
            { name: 'High Value', predicate: 'input.amount > 1000', linkedNodes: ['premium'] },
            { name: 'VIP', predicate: 'input.vip === true', linkedNodes: ['vip-service'] },
            { name: 'Regular', predicate: 'input.regular === true', linkedNodes: ['standard'] },
          ],
        });

      const toolId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({
          input: { amount: 1500, vip: true, regular: false },
          evaluateAll: true,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].conditionName).toBe('High Value');
      expect(response.body[1].conditionName).toBe('VIP');
    });

    it('should return not satisfied when no condition matches', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Router',
          conditions: [
            { name: 'Condition1', predicate: 'input.value === 10', linkedNodes: [] },
          ],
        });

      const toolId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({
          input: { value: 20 },
        });

      expect(response.status).toBe(200);
      expect(response.body.satisfied).toBe(false);
    });

    it('should return 404 when tool not found', async () => {
      const response = await request(app)
        .post('/api/tools/condition/non-existent-id/evaluate')
        .send({ input: {} });

      expect(response.status).toBe(404);
    });
  });

  describe('Integration with WebHook Trigger', () => {
    it('should evaluate condition from webhook payload', async () => {
      // Create condition tool
      const conditionResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'WebHook Router',
          conditions: [
            { name: 'Order', predicate: 'input.event === "order.created"', linkedNodes: ['process-order'] },
            { name: 'Payment', predicate: 'input.event === "payment.received"', linkedNodes: ['process-payment'] },
          ],
        });

      const toolId = conditionResponse.body.id;

      // Simulate webhook payload
      const webhookPayload = {
        event: 'order.created',
        orderId: '12345',
        customer: 'John Doe',
        amount: 99.99,
      };

      const evalResponse = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({ input: webhookPayload });

      expect(evalResponse.status).toBe(200);
      expect(evalResponse.body.conditionName).toBe('Order');
      expect(evalResponse.body.linkedNodes).toEqual(['process-order']);
    });
  });

  describe('Complex Condition Scenarios', () => {
    it('should handle nested object evaluation', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Nested Router',
          conditions: [
            {
              name: 'High Priority',
              predicate: 'input.request.priority === "high" && input.request.urgency > 8',
              linkedNodes: ['urgent-flow'],
            },
          ],
        });

      const toolId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({
          input: {
            request: {
              priority: 'high',
              urgency: 9,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.satisfied).toBe(true);
    });

    it('should handle array operations in predicates', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Array Router',
          conditions: [
            {
              name: 'Multiple Items',
              predicate: 'input.items && input.items.length > 3',
              linkedNodes: ['bulk-process'],
            },
          ],
        });

      const toolId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({
          input: {
            items: [1, 2, 3, 4, 5],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.satisfied).toBe(true);
    });
  });
});
