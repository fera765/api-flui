import { SystemConfig, SystemConfigProps } from '../domain/SystemConfig';
import { ISystemConfigRepository } from './ISystemConfigRepository';

export class SystemConfigRepositoryInMemory implements ISystemConfigRepository {
  private config: SystemConfig | null = null;

  public async save(configProps: SystemConfigProps): Promise<SystemConfig> {
    const config = new SystemConfig(configProps);
    this.config = config;
    return config;
  }

  public async findCurrent(): Promise<SystemConfig | null> {
    return this.config;
  }

  public async update(configProps: Partial<SystemConfigProps>): Promise<SystemConfig> {
    if (!this.config) {
      throw new Error('No configuration found to update');
    }

    const currentConfig = this.config.toJSON();
    const updatedConfig = new SystemConfig({
      endpoint: configProps.endpoint ?? currentConfig.endpoint,
      apiKey: configProps.apiKey ?? currentConfig.apiKey,
      model: configProps.model ?? currentConfig.model,
    });

    this.config = updatedConfig;
    return updatedConfig;
  }

  // Method for testing purposes
  public clear(): void {
    this.config = null;
  }
}
