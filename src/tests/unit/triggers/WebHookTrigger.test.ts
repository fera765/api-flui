import { 
  createWebHookTriggerTool, 
  generateWebHookToken, 
  generateWebHookURL 
} from '@modules/core/tools/triggers/WebHookTriggerTool';
import { ToolType, TriggerWebHookConfig } from '@modules/core/domain/SystemTool';

describe('WebHookTriggerTool', () => {
  describe('token generation', () => {
    it('should generate unique webhook tokens', () => {
      const token1 = generateWebHookToken();
      const token2 = generateWebHookToken();

      expect(token1).toMatch(/^whk_[a-f0-9]{32}$/);
      expect(token2).toMatch(/^whk_[a-f0-9]{32}$/);
      expect(token1).not.toBe(token2);
    });
  });

  describe('URL generation', () => {
    it('should generate webhook URL with default base', () => {
      const url = generateWebHookURL('test-id');
      expect(url).toBe('http://localhost:3000/api/webhooks/test-id');
    });

    it('should generate webhook URL with custom base', () => {
      const url = generateWebHookURL('test-id', 'https://api.example.com');
      expect(url).toBe('https://api.example.com/api/webhooks/test-id');
    });
  });

  describe('tool creation', () => {
    it('should create webhook trigger with POST method', () => {
      const tool = createWebHookTriggerTool('POST');
      const config = tool.getConfig() as TriggerWebHookConfig;

      expect(tool.getName()).toBe('WebHookTrigger');
      expect(tool.getType()).toBe(ToolType.TRIGGER);
      expect(config.method).toBe('POST');
      expect(config.url).toContain('/api/webhooks/');
      expect(config.token).toMatch(/^whk_/);
    });

    it('should create webhook trigger with GET method', () => {
      const tool = createWebHookTriggerTool('GET');
      const config = tool.getConfig() as TriggerWebHookConfig;

      expect(config.method).toBe('GET');
    });

    it('should create webhook with custom inputs', () => {
      const inputs = {
        message: 'string' as const,
        count: 'number' as const,
      };
      const tool = createWebHookTriggerTool('POST', inputs);
      const config = tool.getConfig() as TriggerWebHookConfig;

      expect(config.inputs).toEqual(inputs);
    });

    it('should create webhook with custom config', () => {
      const customConfig = { timeout: 5000 };
      const tool = createWebHookTriggerTool('POST', undefined, customConfig);
      const config = tool.getConfig() as TriggerWebHookConfig;

      expect(config.customConfig).toEqual(customConfig);
    });

    it('should execute and return payload', async () => {
      const tool = createWebHookTriggerTool('POST');
      const payload = { test: 'data' };

      const result = await tool.execute(payload) as { status: string; receivedAt: string; payload: unknown };

      expect(result.status).toBe('received');
      expect(result.receivedAt).toBeDefined();
      expect(result.payload).toEqual(payload);
    });

    it('should create with all parameters', () => {
      const inputs = { message: 'string' as const };
      const customConfig = { timeout: 5000 };
      const baseURL = 'https://custom.com';
      
      const tool = createWebHookTriggerTool('POST', inputs, customConfig, baseURL);
      const config = tool.getConfig() as TriggerWebHookConfig;

      expect(config.url).toContain('https://custom.com');
      expect(config.customConfig).toEqual(customConfig);
    });
  });
});
