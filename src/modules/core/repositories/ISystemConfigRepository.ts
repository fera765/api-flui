import { SystemConfig, SystemConfigProps } from '../domain/SystemConfig';

export interface ISystemConfigRepository {
  save(config: SystemConfigProps): Promise<SystemConfig>;
  findCurrent(): Promise<SystemConfig | null>;
  update(config: Partial<SystemConfigProps>): Promise<SystemConfig>;
}
