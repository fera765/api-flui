import { CreateSystemToolProps, SystemToolResponse, TriggerWebHookConfig } from '../domain/SystemTool';
import { ISystemToolRepository } from '../repositories/ISystemToolRepository';
import { AppError } from '@shared/errors';

export interface ISystemToolService {
  createTool(props: CreateSystemToolProps): Promise<SystemToolResponse>;
  getAllTools(): Promise<SystemToolResponse[]>;
  getToolById(id: string): Promise<SystemToolResponse>;
  deleteTool(id: string): Promise<void>;
  executeTool(id: string, input: unknown): Promise<unknown>;
  executeWebHook(toolId: string, token: string, payload: unknown): Promise<unknown>;
}

export class SystemToolService implements ISystemToolService {
  constructor(private readonly repository: ISystemToolRepository) {}

  public async createTool(props: CreateSystemToolProps): Promise<SystemToolResponse> {
    if (!props.name || props.name.trim() === '') {
      throw new AppError('Tool name is required', 400);
    }

    // Check if tool with same name already exists
    const existing = await this.repository.findByName(props.name);
    if (existing) {
      throw new AppError('Tool with this name already exists', 400);
    }

    const tool = await this.repository.create(props);
    return tool.toJSON();
  }

  public async getAllTools(): Promise<SystemToolResponse[]> {
    const tools = await this.repository.findAll();
    return tools.map(tool => tool.toJSON());
  }

  public async getToolById(id: string): Promise<SystemToolResponse> {
    const tool = await this.repository.findById(id);

    if (!tool) {
      throw new AppError('Tool not found', 404);
    }

    return tool.toJSON();
  }

  public async deleteTool(id: string): Promise<void> {
    const tool = await this.repository.findById(id);
    if (!tool) {
      throw new AppError('Tool not found', 404);
    }

    try {
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Tool not found') {
        throw new AppError('Tool not found', 404);
      }
      throw error;
    }
  }

  public async executeTool(id: string, input: unknown): Promise<unknown> {
    const tool = await this.repository.findById(id);

    if (!tool) {
      throw new AppError('Tool not found', 404);
    }

    try {
      return await tool.execute(input);
    } catch (error) {
      throw new AppError(
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async executeWebHook(toolId: string, token: string, payload: unknown): Promise<unknown> {
    const tool = await this.repository.findById(toolId);

    if (!tool) {
      throw new AppError('WebHook not found', 404);
    }

    const config = tool.getConfig() as TriggerWebHookConfig;

    if (!config || !config.token) {
      throw new AppError('Invalid webhook configuration', 400);
    }

    if (config.token !== token) {
      throw new AppError('Invalid webhook token', 401);
    }

    try {
      return await tool.execute(payload);
    } catch (error) {
      throw new AppError(
        `WebHook execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}
