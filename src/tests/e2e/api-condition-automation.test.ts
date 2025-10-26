import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnlyConditions__ } from '@modules/core/routes/condition.routes';
import { __testOnlyAgents__ } from '@modules/core/routes/agents.routes';
import { __testOnlyTools__ } from '@modules/core/routes/tools.routes';

/**
 * End-to-End Test Suite - ConditionTool in Automation
 * 
 * This test suite validates the complete workflow of using ConditionTool
 * within automations, demonstrating branching flows based on conditions.
 */
describe('E2E - ConditionTool in Automation Workflows', () => {
  beforeEach(() => {
    __testOnlyConditions__.clearRepository();
    __testOnlyAgents__.clearRepository();
    __testOnlyTools__.clearRepository();
  });

  describe('Scenario 1: E-commerce Order Processing with Conditional Routing', () => {
    it('should route orders based on value and customer type', async () => {
      // ==========================================
      // STEP 1: Create Agents for different flows
      // ==========================================

      const vipAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'VIP Order Processor',
          prompt: 'You handle VIP orders with priority service and personalized attention.',
          defaultModel: 'gpt-4',
        });
      expect(vipAgentResponse.status).toBe(201);
      const vipAgentId = vipAgentResponse.body.id;

      const standardAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Standard Order Processor',
          prompt: 'You handle standard orders efficiently.',
          defaultModel: 'gpt-3.5-turbo',
        });
      expect(standardAgentResponse.status).toBe(201);
      const standardAgentId = standardAgentResponse.body.id;

      const lowPriorityAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Low Priority Processor',
          prompt: 'You handle low priority orders in batch mode.',
          defaultModel: 'gpt-3.5-turbo',
        });
      expect(lowPriorityAgentResponse.status).toBe(201);
      const lowPriorityAgentId = lowPriorityAgentResponse.body.id;

      // ==========================================
      // STEP 2: Create ConditionTool for routing
      // ==========================================

      const conditionToolResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Order Router',
          description: 'Routes orders based on value and customer type',
          conditions: [
            {
              name: 'VIP High Value',
              predicate: 'input.customerType === "vip" && input.orderValue > 1000',
              linkedNodes: [vipAgentId],
            },
            {
              name: 'VIP Standard',
              predicate: 'input.customerType === "vip" && input.orderValue <= 1000',
              linkedNodes: [vipAgentId],
            },
            {
              name: 'Standard High Value',
              predicate: 'input.customerType === "standard" && input.orderValue > 500',
              linkedNodes: [standardAgentId],
            },
            {
              name: 'Low Priority',
              predicate: 'input.orderValue <= 100',
              linkedNodes: [lowPriorityAgentId],
            },
          ],
        });

      expect(conditionToolResponse.status).toBe(201);
      const conditionToolId = conditionToolResponse.body.id;

      // ==========================================
      // STEP 3: Test condition evaluation
      // ==========================================

      // Test VIP High Value
      const vipHighValueTest = await request(app)
        .post(`/api/tools/condition/${conditionToolId}/evaluate`)
        .send({
          input: {
            customerType: 'vip',
            orderValue: 1500,
            orderId: 'ORD-001',
          },
        });

      expect(vipHighValueTest.status).toBe(200);
      expect(vipHighValueTest.body.satisfied).toBe(true);
      expect(vipHighValueTest.body.conditionName).toBe('VIP High Value');
      expect(vipHighValueTest.body.linkedNodes).toEqual([vipAgentId]);

      // Test Standard High Value
      const standardHighValueTest = await request(app)
        .post(`/api/tools/condition/${conditionToolId}/evaluate`)
        .send({
          input: {
            customerType: 'standard',
            orderValue: 750,
            orderId: 'ORD-002',
          },
        });

      expect(standardHighValueTest.status).toBe(200);
      expect(standardHighValueTest.body.conditionName).toBe('Standard High Value');
      expect(standardHighValueTest.body.linkedNodes).toEqual([standardAgentId]);

      // Test Low Priority
      const lowPriorityTest = await request(app)
        .post(`/api/tools/condition/${conditionToolId}/evaluate`)
        .send({
          input: {
            customerType: 'standard',
            orderValue: 50,
            orderId: 'ORD-003',
          },
        });

      expect(lowPriorityTest.status).toBe(200);
      expect(lowPriorityTest.body.conditionName).toBe('Low Priority');
      expect(lowPriorityTest.body.linkedNodes).toEqual([lowPriorityAgentId]);
    });
  });

  describe('Scenario 2: Customer Support Ticket Routing', () => {
    it('should route support tickets based on urgency and category', async () => {
      // Create specialized support agents
      const technicalAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Technical Support',
          prompt: 'You are a technical support specialist handling complex technical issues.',
        });

      const billingAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Billing Support',
          prompt: 'You handle billing inquiries and payment issues.',
        });

      const generalAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'General Support',
          prompt: 'You handle general customer inquiries.',
        });

      // Create condition tool for ticket routing
      const routerResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Support Ticket Router',
          description: 'Routes tickets to appropriate support team',
          conditions: [
            {
              name: 'Urgent Technical',
              predicate: 'input.category === "technical" && input.urgency === "high"',
              linkedNodes: [technicalAgentResponse.body.id],
            },
            {
              name: 'Technical',
              predicate: 'input.category === "technical"',
              linkedNodes: [technicalAgentResponse.body.id],
            },
            {
              name: 'Billing',
              predicate: 'input.category === "billing"',
              linkedNodes: [billingAgentResponse.body.id],
            },
            {
              name: 'General',
              predicate: 'input.category === "general"',
              linkedNodes: [generalAgentResponse.body.id],
            },
          ],
        });

      expect(routerResponse.status).toBe(201);

      // Test routing scenarios
      const urgentTechTicket = await request(app)
        .post(`/api/tools/condition/${routerResponse.body.id}/evaluate`)
        .send({
          input: {
            category: 'technical',
            urgency: 'high',
            ticketId: 'TKT-001',
            description: 'Server is down',
          },
        });

      expect(urgentTechTicket.body.conditionName).toBe('Urgent Technical');

      const billingTicket = await request(app)
        .post(`/api/tools/condition/${routerResponse.body.id}/evaluate`)
        .send({
          input: {
            category: 'billing',
            urgency: 'medium',
            ticketId: 'TKT-002',
          },
        });

      expect(billingTicket.body.conditionName).toBe('Billing');
    });
  });

  describe('Scenario 3: Multi-Step Approval Workflow', () => {
    it('should route approvals based on amount and department', async () => {
      // Create approval agents
      const managerResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Manager',
          prompt: 'You review and approve requests up to $5000.',
        });

      const directorResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Director',
          prompt: 'You review and approve requests between $5000 and $50000.',
        });

      const ceoResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'CEO',
          prompt: 'You review and approve high-value requests above $50000.',
        });

      // Create approval router
      const approvalRouterResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Approval Router',
          description: 'Routes approvals based on amount',
          conditions: [
            {
              name: 'CEO Approval',
              predicate: 'input.amount > 50000',
              linkedNodes: [ceoResponse.body.id],
            },
            {
              name: 'Director Approval',
              predicate: 'input.amount > 5000 && input.amount <= 50000',
              linkedNodes: [directorResponse.body.id],
            },
            {
              name: 'Manager Approval',
              predicate: 'input.amount <= 5000',
              linkedNodes: [managerResponse.body.id],
            },
          ],
        });

      expect(approvalRouterResponse.status).toBe(201);

      // Test different approval levels
      const testCases = [
        { amount: 3000, expectedCondition: 'Manager Approval' },
        { amount: 25000, expectedCondition: 'Director Approval' },
        { amount: 75000, expectedCondition: 'CEO Approval' },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post(`/api/tools/condition/${approvalRouterResponse.body.id}/evaluate`)
          .send({
            input: {
              amount: testCase.amount,
              department: 'Finance',
              requestId: `REQ-${testCase.amount}`,
            },
          });

        expect(response.body.conditionName).toBe(testCase.expectedCondition);
      }
    });
  });

  describe('Scenario 4: Content Moderation Pipeline', () => {
    it('should evaluate multiple conditions for content filtering', async () => {
      // Create moderation agents
      const autoApproveResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Auto Approve',
          prompt: 'Automatically approve safe content.',
        });

      const manualReviewResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Manual Review',
          prompt: 'Manually review flagged content.',
        });

      const autoRejectResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Auto Reject',
          prompt: 'Automatically reject harmful content.',
        });

      // Create content moderation router
      const moderationRouterResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Content Moderator',
          description: 'Routes content based on safety score',
          conditions: [
            {
              name: 'Auto Approve',
              predicate: 'input.safetyScore > 90 && input.flagCount === 0',
              linkedNodes: [autoApproveResponse.body.id],
            },
            {
              name: 'Manual Review',
              predicate: 'input.safetyScore >= 50 && input.safetyScore <= 90',
              linkedNodes: [manualReviewResponse.body.id],
            },
            {
              name: 'Auto Reject',
              predicate: 'input.safetyScore < 50 || input.flagCount > 3',
              linkedNodes: [autoRejectResponse.body.id],
            },
          ],
        });

      expect(moderationRouterResponse.status).toBe(201);

      // Test moderation scenarios
      const safeContent = await request(app)
        .post(`/api/tools/condition/${moderationRouterResponse.body.id}/evaluate`)
        .send({
          input: {
            contentId: 'CNT-001',
            safetyScore: 95,
            flagCount: 0,
            contentType: 'text',
          },
        });

      expect(safeContent.body.conditionName).toBe('Auto Approve');

      const questionableContent = await request(app)
        .post(`/api/tools/condition/${moderationRouterResponse.body.id}/evaluate`)
        .send({
          input: {
            contentId: 'CNT-002',
            safetyScore: 70,
            flagCount: 1,
          },
        });

      expect(questionableContent.body.conditionName).toBe('Manual Review');

      const unsafeContent = await request(app)
        .post(`/api/tools/condition/${moderationRouterResponse.body.id}/evaluate`)
        .send({
          input: {
            contentId: 'CNT-003',
            safetyScore: 30,
            flagCount: 5,
          },
        });

      expect(unsafeContent.body.conditionName).toBe('Auto Reject');
    });
  });

  describe('Scenario 5: Update and Delete Operations', () => {
    it('should update condition tool and re-evaluate', async () => {
      // Create initial condition tool
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Simple Router',
          conditions: [
            {
              name: 'High Value',
              predicate: 'input.value > 100',
              linkedNodes: ['node-1'],
            },
          ],
        });

      const toolId = createResponse.body.id;

      // Initial evaluation
      const eval1 = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({ input: { value: 150 } });

      expect(eval1.body.satisfied).toBe(true);

      // Update the condition
      await request(app)
        .patch(`/api/tools/condition/${toolId}`)
        .send({
          conditions: [
            {
              name: 'Very High Value',
              predicate: 'input.value > 500',
              linkedNodes: ['node-2'],
            },
          ],
        });

      // Re-evaluate with same input
      const eval2 = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({ input: { value: 150 } });

      expect(eval2.body.satisfied).toBe(false);

      // Evaluate with higher value
      const eval3 = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({ input: { value: 600 } });

      expect(eval3.body.satisfied).toBe(true);
      expect(eval3.body.conditionName).toBe('Very High Value');
    });
  });

  describe('Scenario 6: Evaluate All Conditions', () => {
    it('should return all satisfied conditions when evaluateAll is true', async () => {
      const createResponse = await request(app)
        .post('/api/tools/condition')
        .send({
          name: 'Multi-Match Router',
          conditions: [
            {
              name: 'Premium',
              predicate: 'input.tier === "premium"',
              linkedNodes: ['premium-flow'],
            },
            {
              name: 'High Spend',
              predicate: 'input.totalSpent > 10000',
              linkedNodes: ['rewards-flow'],
            },
            {
              name: 'Long Term',
              predicate: 'input.memberYears > 5',
              linkedNodes: ['loyalty-flow'],
            },
          ],
        });

      const toolId = createResponse.body.id;

      // Customer matching multiple conditions
      const response = await request(app)
        .post(`/api/tools/condition/${toolId}/evaluate`)
        .send({
          input: {
            tier: 'premium',
            totalSpent: 15000,
            memberYears: 7,
          },
          evaluateAll: true,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      expect(response.body.map((r: any) => r.conditionName)).toEqual([
        'Premium',
        'High Spend',
        'Long Term',
      ]);
    });
  });
});
