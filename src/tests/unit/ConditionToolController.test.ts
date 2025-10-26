import { Request, Response } from 'express';
import { ConditionToolController } from '@modules/core/controllers/ConditionToolController';
import { ConditionToolService } from '@modules/core/services/ConditionToolService';
import { ConditionToolRepositoryInMemory } from '@modules/core/repositories/ConditionToolRepositoryInMemory';

describe('ConditionToolController', () => {
  let controller: ConditionToolController;
  let service: ConditionToolService;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    const repository = new ConditionToolRepositoryInMemory();
    service = new ConditionToolService(repository);
    controller = new ConditionToolController(service);

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('create', () => {
    it('should create a condition tool', async () => {
      req.body = {
        name: 'Test Tool',
        conditions: [
          {
            name: 'Test Condition',
            predicate: 'true',
            linkedNodes: [],
          },
        ],
      };

      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Tool',
          type: 'atoom',
        })
      );
    });
  });

  describe('getAll', () => {
    it('should return all condition tools', async () => {
      await controller.getAll(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getById', () => {
    it('should return condition tool by id', async () => {
      // First create a tool
      const created = await service.createConditionTool({
        name: 'Test',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      req.params = { id: created.id };

      await controller.getById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: created.id,
          name: 'Test',
        })
      );
    });
  });

  describe('update', () => {
    it('should update condition tool', async () => {
      // First create a tool
      const created = await service.createConditionTool({
        name: 'Original',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      req.params = { id: created.id };
      req.body = {
        name: 'Updated',
        description: 'Updated Description',
      };

      await controller.update(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated',
          description: 'Updated Description',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete condition tool', async () => {
      // First create a tool
      const created = await service.createConditionTool({
        name: 'Test',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      req.params = { id: created.id };

      await controller.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('evaluate', () => {
    it('should evaluate condition', async () => {
      // First create a tool
      const created = await service.createConditionTool({
        name: 'Router',
        conditions: [{ name: 'Test', predicate: 'input.value === 10', linkedNodes: ['node-1'] }],
      });

      req.params = { id: created.id };
      req.body = {
        input: { value: 10 },
      };

      await controller.evaluate(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          satisfied: true,
        })
      );
    });
  });
});
