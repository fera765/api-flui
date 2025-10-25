import { SystemConfig } from '@modules/core/domain/SystemConfig';

describe('SystemConfig Domain', () => {
  it('should create a SystemConfig with all properties', () => {
    const config = new SystemConfig({
      endpoint: 'https://test.api.com/v1',
      apiKey: 'test-key-123',
      model: 'gpt-4',
    });

    expect(config.getEndpoint()).toBe('https://test.api.com/v1');
    expect(config.getApiKey()).toBe('test-key-123');
    expect(config.getModel()).toBe('gpt-4');
  });

  it('should create a SystemConfig without apiKey', () => {
    const config = new SystemConfig({
      endpoint: 'https://test.api.com/v1',
      model: 'gpt-4',
    });

    expect(config.getEndpoint()).toBe('https://test.api.com/v1');
    expect(config.getApiKey()).toBeUndefined();
    expect(config.getModel()).toBe('gpt-4');
  });

  it('should return correct JSON representation', () => {
    const config = new SystemConfig({
      endpoint: 'https://test.api.com/v1',
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
    });

    const json = config.toJSON();

    expect(json).toEqual({
      endpoint: 'https://test.api.com/v1',
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
    });
  });

  it('should return JSON without apiKey when not provided', () => {
    const config = new SystemConfig({
      endpoint: 'https://test.api.com/v1',
      model: 'gpt-4',
    });

    const json = config.toJSON();

    expect(json).toEqual({
      endpoint: 'https://test.api.com/v1',
      model: 'gpt-4',
    });
    expect(json.apiKey).toBeUndefined();
  });
});
