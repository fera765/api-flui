import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';

describe('AgentRepositoryInMemory', () => {
  let repository: AgentRepositoryInMemory;

  beforeEach(() => {
    repository = new AgentRepositoryInMemory();
  });

  describe('create', () => {
    it('should create an agent with required fields', async () => {
      const agent = await repository.create({
        name: 'Test Agent',
        prompt: 'You are helpful',
      });

      expect(agent.getId()).toBeDefined();
      expect(agent.getName()).toBe('Test Agent');
      expect(agent.getPrompt()).toBe('You are helpful');
      expect(agent.getTools()).toEqual([]);
    });

    it('should create an agent with all fields', async () => {
      const agent = await repository.create({
        name: 'Complete Agent',
        description: 'A complete agent',
        prompt: 'You are an expert',
        defaultModel: 'gpt-4',
        tools: [],
      });

      expect(agent.getId()).toBeDefined();
      expect(agent.getName()).toBe('Complete Agent');
      expect(agent.getDescription()).toBe('A complete agent');
      expect(agent.getDefaultModel()).toBe('gpt-4');
    });

    it('should generate unique IDs for each agent', async () => {
      const agent1 = await repository.create({
        name: 'Agent 1',
        prompt: 'Prompt 1',
      });

      const agent2 = await repository.create({
        name: 'Agent 2',
        prompt: 'Prompt 2',
      });

      expect(agent1.getId()).not.toBe(agent2.getId());
    });
  });

  describe('findAll', () => {
    it('should return empty array when no agents exist', async () => {
      const agents = await repository.findAll();
      expect(agents).toEqual([]);
    });

    it('should return all agents', async () => {
      await repository.create({
        name: 'Agent 1',
        prompt: 'Prompt 1',
      });

      await repository.create({
        name: 'Agent 2',
        prompt: 'Prompt 2',
      });

      const agents = await repository.findAll();
      expect(agents).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return null when agent not found', async () => {
      const agent = await repository.findById('non-existent-id');
      expect(agent).toBeNull();
    });

    it('should return agent by id', async () => {
      const created = await repository.create({
        name: 'Test Agent',
        prompt: 'Test prompt',
      });

      const found = await repository.findById(created.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(created.getId());
      expect(found?.getName()).toBe('Test Agent');
    });
  });

  describe('update', () => {
    it('should update agent fields', async () => {
      const agent = await repository.create({
        name: 'Original',
        prompt: 'Original prompt',
      });

      const updated = await repository.update(agent.getId(), {
        name: 'Updated',
        description: 'New description',
      });

      expect(updated.getName()).toBe('Updated');
      expect(updated.getDescription()).toBe('New description');
      expect(updated.getPrompt()).toBe('Original prompt');
    });

    it('should throw error when agent not found', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('delete', () => {
    it('should delete an agent', async () => {
      const agent = await repository.create({
        name: 'To Delete',
        prompt: 'Will be deleted',
      });

      await repository.delete(agent.getId());

      const found = await repository.findById(agent.getId());
      expect(found).toBeNull();
    });

    it('should throw error when agent not found', async () => {
      await expect(
        repository.delete('non-existent-id')
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('clear', () => {
    it('should clear all agents', async () => {
      await repository.create({
        name: 'Agent 1',
        prompt: 'Prompt 1',
      });

      await repository.create({
        name: 'Agent 2',
        prompt: 'Prompt 2',
      });

      repository.clear();

      const agents = await repository.findAll();
      expect(agents).toEqual([]);
    });
  });
});
