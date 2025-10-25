import { AgentService } from '@modules/core/services/AgentService';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';

describe('AgentService', () => {
  let service: AgentService;
  let repository: AgentRepositoryInMemory;

  beforeEach(() => {
    repository = new AgentRepositoryInMemory();
    service = new AgentService(repository);
  });

  describe('createAgent', () => {
    it('should create an agent with required fields', async () => {
      const agent = await service.createAgent({
        name: 'Test Agent',
        prompt: 'You are helpful',
      });

      expect(agent).toHaveProperty('id');
      expect(agent.name).toBe('Test Agent');
      expect(agent.prompt).toBe('You are helpful');
      expect(agent.tools).toEqual([]);
    });

    it('should create an agent with all fields', async () => {
      const agent = await service.createAgent({
        name: 'Complete Agent',
        description: 'A complete agent',
        prompt: 'You are an expert',
        defaultModel: 'gpt-4',
      });

      expect(agent.description).toBe('A complete agent');
      expect(agent.defaultModel).toBe('gpt-4');
    });

    it('should throw error when name is missing', async () => {
      await expect(
        service.createAgent({
          name: '',
          prompt: 'Prompt',
        })
      ).rejects.toThrow('Name is required');
    });

    it('should throw error when prompt is missing', async () => {
      await expect(
        service.createAgent({
          name: 'Agent',
          prompt: '',
        })
      ).rejects.toThrow('Prompt is required');
    });
  });

  describe('getAllAgents', () => {
    it('should return empty array when no agents exist', async () => {
      const agents = await service.getAllAgents();
      expect(agents).toEqual([]);
    });

    it('should return all agents', async () => {
      await service.createAgent({
        name: 'Agent 1',
        prompt: 'Prompt 1',
      });

      await service.createAgent({
        name: 'Agent 2',
        prompt: 'Prompt 2',
      });

      const agents = await service.getAllAgents();
      expect(agents).toHaveLength(2);
    });
  });

  describe('getAgentById', () => {
    it('should return agent by id', async () => {
      const created = await service.createAgent({
        name: 'Test Agent',
        prompt: 'Test prompt',
      });

      const agent = await service.getAgentById(created.id);

      expect(agent).toEqual(created);
    });

    it('should throw error when agent not found', async () => {
      await expect(
        service.getAgentById('non-existent-id')
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('updateAgent', () => {
    it('should update agent fields', async () => {
      const created = await service.createAgent({
        name: 'Original',
        prompt: 'Original prompt',
      });

      const updated = await service.updateAgent(created.id, {
        name: 'Updated',
        description: 'New description',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('New description');
      expect(updated.prompt).toBe('Original prompt');
    });

    it('should throw error when agent not found', async () => {
      await expect(
        service.updateAgent('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Agent not found');
    });

    it('should rethrow non-specific errors on update', async () => {
      const created = await service.createAgent({
        name: 'Test',
        prompt: 'Test prompt',
      });

      const errorMessage = 'Unexpected error';
      jest.spyOn(repository, 'update').mockRejectedValue(new Error(errorMessage));

      await expect(
        service.updateAgent(created.id, { name: 'Updated' })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('deleteAgent', () => {
    it('should delete an agent', async () => {
      const created = await service.createAgent({
        name: 'To Delete',
        prompt: 'Will be deleted',
      });

      await service.deleteAgent(created.id);

      await expect(
        service.getAgentById(created.id)
      ).rejects.toThrow('Agent not found');
    });

    it('should throw error when agent not found', async () => {
      await expect(
        service.deleteAgent('non-existent-id')
      ).rejects.toThrow('Agent not found');
    });

    it('should rethrow non-specific errors on delete', async () => {
      const created = await service.createAgent({
        name: 'Test',
        prompt: 'Test prompt',
      });

      const errorMessage = 'Unexpected error';
      jest.spyOn(repository, 'delete').mockRejectedValue(new Error(errorMessage));

      await expect(
        service.deleteAgent(created.id)
      ).rejects.toThrow(errorMessage);
    });
  });
});
