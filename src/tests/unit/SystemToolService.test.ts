import { SystemToolService } from '@modules/core/services/SystemToolService';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('SystemToolService', () => {
  let service: SystemToolService;
  let repository: SystemToolRepositoryInMemory;

  beforeEach(() => {
    repository = new SystemToolRepositoryInMemory();
    service = new SystemToolService(repository);
  });

  const mockExecutor = async (input: unknown) => input;

  describe('createTool', () => {
    it('should create a tool', async () => {
      const tool = await service.createTool({
        name: 'TestTool',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      expect(tool).toHaveProperty('id');
      expect(tool.name).toBe('TestTool');
    });

    it('should throw error when name is empty', async () => {
      await expect(
        service.createTool({
          name: '',
          type: ToolType.ACTION,
          executor: mockExecutor,
        })
      ).rejects.toThrow('Tool name is required');
    });

    it('should throw error when tool name already exists', async () => {
      await service.createTool({
        name: 'DuplicateTool',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      await expect(
        service.createTool({
          name: 'DuplicateTool',
          type: ToolType.ACTION,
          executor: mockExecutor,
        })
      ).rejects.toThrow('Tool with this name already exists');
    });
  });

  describe('getAllTools', () => {
    it('should return empty array when no tools', async () => {
      const tools = await service.getAllTools();
      expect(tools).toEqual([]);
    });

    it('should return all tools', async () => {
      await service.createTool({ name: 'Tool1', type: ToolType.ACTION, executor: mockExecutor });
      await service.createTool({ name: 'Tool2', type: ToolType.TRIGGER, executor: mockExecutor });

      const tools = await service.getAllTools();
      expect(tools).toHaveLength(2);
    });
  });

  describe('getToolById', () => {
    it('should return tool by id', async () => {
      const created = await service.createTool({
        name: 'TestTool',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      const tool = await service.getToolById(created.id);
      expect(tool.id).toBe(created.id);
    });

    it('should throw error when tool not found', async () => {
      await expect(
        service.getToolById('non-existent-id')
      ).rejects.toThrow('Tool not found');
    });
  });

  describe('deleteTool', () => {
    it('should delete a tool', async () => {
      const created = await service.createTool({
        name: 'ToDelete',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      await service.deleteTool(created.id);

      await expect(
        service.getToolById(created.id)
      ).rejects.toThrow('Tool not found');
    });

    it('should throw error when tool not found', async () => {
      await expect(
        service.deleteTool('non-existent-id')
      ).rejects.toThrow('Tool not found');
    });

    it('should rethrow non-specific errors on delete', async () => {
      const created = await service.createTool({
        name: 'Test',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      const errorMessage = 'Unexpected error';
      jest.spyOn(repository, 'delete').mockRejectedValue(new Error(errorMessage));

      await expect(
        service.deleteTool(created.id)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('executeTool', () => {
    it('should execute a tool', async () => {
      const created = await service.createTool({
        name: 'ExecutableTool',
        type: ToolType.ACTION,
        executor: async (input: unknown) => ({ processed: input }),
      });

      const result = await service.executeTool(created.id, { test: 'data' });
      expect(result).toEqual({ processed: { test: 'data' } });
    });

    it('should throw error when tool not found', async () => {
      await expect(
        service.executeTool('non-existent-id', {})
      ).rejects.toThrow('Tool not found');
    });

    it('should throw error when tool execution fails', async () => {
      const created = await service.createTool({
        name: 'FailingTool',
        type: ToolType.ACTION,
        executor: async () => {
          throw new Error('Execution error');
        },
      });

      await expect(
        service.executeTool(created.id, {})
      ).rejects.toThrow('Tool execution failed');
    });
  });

  describe('executeWebHook', () => {
    it('should execute webhook with valid token', async () => {
      const config = {
        url: 'http://localhost:3000/webhook',
        method: 'POST' as const,
        token: 'valid-token',
      };

      const created = await service.createTool({
        name: 'WebHook',
        type: ToolType.TRIGGER,
        config,
        executor: async (input: unknown) => ({ received: input }),
      });

      const result = await service.executeWebHook(created.id, 'valid-token', { test: 'payload' });
      expect(result).toEqual({ received: { test: 'payload' } });
    });

    it('should throw error with invalid token', async () => {
      const config = {
        url: 'http://localhost:3000/webhook',
        method: 'POST' as const,
        token: 'valid-token',
      };

      const created = await service.createTool({
        name: 'WebHook',
        type: ToolType.TRIGGER,
        config,
        executor: mockExecutor,
      });

      await expect(
        service.executeWebHook(created.id, 'invalid-token', {})
      ).rejects.toThrow('Invalid webhook token');
    });

    it('should throw error when webhook not found', async () => {
      await expect(
        service.executeWebHook('non-existent-id', 'token', {})
      ).rejects.toThrow('WebHook not found');
    });

    it('should throw error when webhook config is invalid', async () => {
      const created = await service.createTool({
        name: 'InvalidWebHook',
        type: ToolType.TRIGGER,
        config: {}, // No token
        executor: mockExecutor,
      });

      await expect(
        service.executeWebHook(created.id, 'token', {})
      ).rejects.toThrow('Invalid webhook configuration');
    });

    it('should throw error when webhook execution fails', async () => {
      const config = {
        url: 'http://localhost:3000/webhook',
        method: 'POST' as const,
        token: 'valid-token',
      };

      const created = await service.createTool({
        name: 'FailingWebHook',
        type: ToolType.TRIGGER,
        config,
        executor: async () => {
          throw new Error('Webhook execution error');
        },
      });

      await expect(
        service.executeWebHook(created.id, 'valid-token', {})
      ).rejects.toThrow('WebHook execution failed');
    });

    it('should throw error for unknown webhook errors', async () => {
      const config = {
        url: 'http://localhost:3000/webhook',
        method: 'POST' as const,
        token: 'valid-token',
      };

      const created = await service.createTool({
        name: 'UnknownErrorWebHook',
        type: ToolType.TRIGGER,
        config,
        executor: async () => {
          throw 'Unknown error'; // eslint-disable-line no-throw-literal
        },
      });

      await expect(
        service.executeWebHook(created.id, 'valid-token', {})
      ).rejects.toThrow('WebHook execution failed: Unknown error');
    });
  });
});
