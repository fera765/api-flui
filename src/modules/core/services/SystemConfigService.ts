import { SystemConfigProps, SystemConfigResponse } from '../domain/SystemConfig';
import { ISystemConfigRepository } from '../repositories/ISystemConfigRepository';
import { AppError } from '@shared/errors';

const DEFAULT_ENDPOINT = 'https://api.llm7.io/v1';
const DEFAULT_MODEL = 'gpt-4';

export interface ISystemConfigService {
  getConfig(): Promise<SystemConfigResponse>;
  createConfig(config: SystemConfigProps): Promise<SystemConfigResponse>;
  updateConfig(config: Partial<SystemConfigProps>): Promise<SystemConfigResponse>;
}

export class SystemConfigService implements ISystemConfigService {
  constructor(private readonly repository: ISystemConfigRepository) {}

  public async getConfig(): Promise<SystemConfigResponse> {
    const config = await this.repository.findCurrent();

    if (!config) {
      return {
        endpoint: DEFAULT_ENDPOINT,
        model: DEFAULT_MODEL,
      };
    }

    return config.toJSON();
  }

  public async createConfig(configProps: SystemConfigProps): Promise<SystemConfigResponse> {
    if (!configProps.endpoint || configProps.endpoint.trim() === '') {
      throw new AppError('Endpoint is required', 400);
    }

    if (!configProps.model || configProps.model.trim() === '') {
      throw new AppError('Model is required', 400);
    }

    const config = await this.repository.save(configProps);
    return config.toJSON();
  }

  public async updateConfig(configProps: Partial<SystemConfigProps>): Promise<SystemConfigResponse> {
    try {
      const config = await this.repository.update(configProps);
      return config.toJSON();
    } catch (error) {
      if (error instanceof Error && error.message === 'No configuration found to update') {
        throw new AppError('No configuration found to update', 404);
      }
      throw error;
    }
  }
}
