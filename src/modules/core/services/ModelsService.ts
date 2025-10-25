import axios from 'axios';
import { ISystemConfigRepository } from '../repositories/ISystemConfigRepository';
import { AppError } from '@shared/errors';

const DEFAULT_ENDPOINT = 'https://api.llm7.io/v1';

export interface IModelsService {
  getModels(): Promise<unknown>;
}

export class ModelsService implements IModelsService {
  constructor(private readonly configRepository: ISystemConfigRepository) {}

  public async getModels(): Promise<unknown> {
    const config = await this.configRepository.findCurrent();
    
    const endpoint = config ? config.getEndpoint() : DEFAULT_ENDPOINT;
    const apiKey = config?.getApiKey();

    const url = `${endpoint}/models`;
    const headers: Record<string, string> = {};

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await axios.get(url, Object.keys(headers).length > 0 ? { headers } : {});
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AppError('Failed to fetch models', 500);
      }
      throw new AppError('Failed to fetch models', 500);
    }
  }
}
