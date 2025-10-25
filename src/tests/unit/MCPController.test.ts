import { Request, Response } from 'express';
import { MCPController } from '@modules/core/controllers/MCPController';
import { MCPService } from '@modules/core/services/MCPService';
import { MCPRepositoryInMemory } from '@modules/core/repositories/MCPRepositoryInMemory';

describe('MCPController', () => {
  let controller: MCPController;
  let service: MCPService;
  let repository: MCPRepositoryInMemory;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    repository = new MCPRepositoryInMemory();
    service = new MCPService(repository);
    controller = new MCPController(service);

    mockRequest = {
      body: {},
      params: {},
    };
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ 
      json: jsonMock,
      send: sendMock,
    });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    };
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('import', () => {
    it('should import an MCP', async () => {
      mockRequest.body = {
        name: 'Test MCP',
        source: '@example/mcp',
      };

      await controller.import(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mcp: expect.objectContaining({
            name: 'Test MCP',
            source: '@example/mcp',
          }),
          toolsExtracted: expect.any(Number),
        })
      );
    });

    it('should import MCP with environment variables', async () => {
      mockRequest.body = {
        name: 'MCP with ENV',
        source: '@example/mcp',
        description: 'Test MCP',
        env: {
          API_KEY: 'secret',
        },
      };

      await controller.import(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mcp: expect.objectContaining({
            env: { API_KEY: 'secret' },
          }),
        })
      );
    });
  });

  describe('getAll', () => {
    it('should return all MCPs', async () => {
      await service.importMCP({
        name: 'MCP 1',
        source: '@example/mcp1',
      });

      await service.importMCP({
        name: 'MCP 2',
        source: '@example/mcp2',
      });

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'MCP 1' }),
          expect.objectContaining({ name: 'MCP 2' }),
        ])
      );
    });

    it('should return empty array when no MCPs', async () => {
      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });
  });

  describe('getTools', () => {
    it('should return tools from MCP', async () => {
      const result = await service.importMCP({
        name: 'Test MCP',
        source: '@pinkpixel/mcpollinations',
      });

      mockRequest.params = { id: result.mcp.id };

      await controller.getTools(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            inputSchema: expect.any(Object),
            outputSchema: expect.any(Object),
          }),
        ])
      );
    });
  });

  describe('delete', () => {
    it('should delete an MCP', async () => {
      const result = await service.importMCP({
        name: 'MCP to Delete',
        source: '@example/mcp',
      });

      mockRequest.params = { id: result.mcp.id };

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
