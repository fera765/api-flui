import { AutomationWebhookService } from '@modules/core/services/AutomationWebhookService';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { NodeType } from '@modules/core/domain/Automation';
import { AppError } from '@shared/errors';

describe('AutomationWebhookService', () => {
  let service: AutomationWebhookService;
  let automationRepository: AutomationRepositoryInMemory;
  let systemToolRepository: SystemToolRepositoryInMemory;

  beforeEach(() => {
    automationRepository = new AutomationRepositoryInMemory();
    systemToolRepository = new SystemToolRepositoryInMemory();
    service = new AutomationWebhookService(
      automationRepository,
      systemToolRepository,
      'http://localhost:3000'
    );
  });

  describe('createWebhookForAutomation', () => {
    it('should create a unique webhook for an automation', async () => {
      // Create automation
      const automation = await automationRepository.create({
        name: 'Test Automation',
        description: 'Test',
        nodes: [
          {
            id: 'node-1',
            type: NodeType.TRIGGER,
            referenceId: 'trigger-id',
          },
        ],
        links: [],
      });

      // Create webhook
      const webhook = await service.createWebhookForAutomation(automation.getId(), {
        method: 'POST',
        inputs: {
          username: 'string',
          age: 'number',
        },
      });

      expect(webhook).toHaveProperty('id');
      expect(webhook).toHaveProperty('url');
      expect(webhook).toHaveProperty('token');
      expect(webhook.method).toBe('POST');
      expect(webhook.inputs).toEqual({
        username: 'string',
        age: 'number',
      });

      // Verify URL format
      expect(webhook.url).toMatch(/http:\/\/localhost:3000\/api\/webhooks\/.+/);
      expect(webhook.token).toMatch(/^whk_[a-f0-9]{32}$/);
    });

    it('should create webhook with default method POST if not provided', async () => {
      const automation = await automationRepository.create({
        name: 'Test Automation',
        description: 'Test',
        nodes: [
          {
            id: 'node-1',
            type: NodeType.TRIGGER,
            referenceId: 'trigger-id',
          },
        ],
        links: [],
      });

      const webhook = await service.createWebhookForAutomation(automation.getId(), {});

      expect(webhook.method).toBe('POST');
      expect(webhook.inputs).toEqual({});
    });

    it('should throw error if automation not found', async () => {
      await expect(
        service.createWebhookForAutomation('non-existent-id', { method: 'POST' })
      ).rejects.toThrow(AppError);

      await expect(
        service.createWebhookForAutomation('non-existent-id', { method: 'POST' })
      ).rejects.toThrow('Automation not found');
    });

    it('should create multiple unique webhooks for different automations', async () => {
      // Create two automations
      const automation1 = await automationRepository.create({
        name: 'Automation 1',
        description: 'Test 1',
        nodes: [{ id: 'node-1', type: NodeType.TRIGGER, referenceId: 'trigger-id' }],
        links: [],
      });

      const automation2 = await automationRepository.create({
        name: 'Automation 2',
        description: 'Test 2',
        nodes: [{ id: 'node-2', type: NodeType.TRIGGER, referenceId: 'trigger-id' }],
        links: [],
      });

      // Create webhooks
      const webhook1 = await service.createWebhookForAutomation(automation1.getId(), {});
      const webhook2 = await service.createWebhookForAutomation(automation2.getId(), {});

      // Verify they are different
      expect(webhook1.id).not.toBe(webhook2.id);
      expect(webhook1.url).not.toBe(webhook2.url);
      expect(webhook1.token).not.toBe(webhook2.token);
    });
  });

  describe('getWebhookByToolId', () => {
    it('should retrieve webhook details by tool ID', async () => {
      const automation = await automationRepository.create({
        name: 'Test Automation',
        description: 'Test',
        nodes: [{ id: 'node-1', type: NodeType.TRIGGER, referenceId: 'trigger-id' }],
        links: [],
      });

      const createdWebhook = await service.createWebhookForAutomation(automation.getId(), {
        method: 'GET',
        inputs: { query: 'string' },
      });

      const retrievedWebhook = await service.getWebhookByToolId(createdWebhook.id);

      expect(retrievedWebhook).toEqual(createdWebhook);
    });

    it('should throw error if webhook not found', async () => {
      await expect(service.getWebhookByToolId('non-existent-id')).rejects.toThrow(AppError);
      await expect(service.getWebhookByToolId('non-existent-id')).rejects.toThrow(
        'Webhook not found'
      );
    });
  });

  describe('updateWebhookConfig', () => {
    it('should update webhook method and inputs', async () => {
      const automation = await automationRepository.create({
        name: 'Test Automation',
        description: 'Test',
        nodes: [{ id: 'node-1', type: NodeType.TRIGGER, referenceId: 'trigger-id' }],
        links: [],
      });

      const webhook = await service.createWebhookForAutomation(automation.getId(), {
        method: 'POST',
        inputs: { username: 'string' },
      });

      const updated = await service.updateWebhookConfig(webhook.id, {
        method: 'GET',
        inputs: { query: 'string', page: 'number' },
      });

      expect(updated.method).toBe('GET');
      expect(updated.inputs).toEqual({ query: 'string', page: 'number' });
      // URL and token should remain the same
      expect(updated.url).toBe(webhook.url);
      expect(updated.token).toBe(webhook.token);
    });

    it('should keep existing values if not provided in update', async () => {
      const automation = await automationRepository.create({
        name: 'Test Automation',
        description: 'Test',
        nodes: [{ id: 'node-1', type: NodeType.TRIGGER, referenceId: 'trigger-id' }],
        links: [],
      });

      const webhook = await service.createWebhookForAutomation(automation.getId(), {
        method: 'POST',
        inputs: { username: 'string' },
      });

      const updated = await service.updateWebhookConfig(webhook.id, {
        method: 'GET',
      });

      expect(updated.method).toBe('GET');
      expect(updated.inputs).toEqual({ username: 'string' }); // Should keep original
    });

    it('should throw error if webhook not found', async () => {
      await expect(
        service.updateWebhookConfig('non-existent-id', { method: 'GET' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook successfully', async () => {
      const automation = await automationRepository.create({
        name: 'Test Automation',
        description: 'Test',
        nodes: [{ id: 'node-1', type: NodeType.TRIGGER, referenceId: 'trigger-id' }],
        links: [],
      });

      const webhook = await service.createWebhookForAutomation(automation.getId(), {});

      await service.deleteWebhook(webhook.id);

      // Verify it's deleted
      await expect(service.getWebhookByToolId(webhook.id)).rejects.toThrow('Webhook not found');
    });

    it('should throw error if webhook not found', async () => {
      await expect(service.deleteWebhook('non-existent-id')).rejects.toThrow(AppError);
      await expect(service.deleteWebhook('non-existent-id')).rejects.toThrow('Webhook not found');
    });
  });
});
