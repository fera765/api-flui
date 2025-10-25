import { AutomationImport } from '@modules/core/domain/AutomationImport';
import { AutomationExportResponse } from '@modules/core/domain/AutomationExport';
import { AutomationStatus } from '@modules/core/domain/Automation';

describe('AutomationImport Entity', () => {
  const createValidExportData = (): AutomationExportResponse => ({
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    automation: {
      id: 'auto-1',
      name: 'Test Automation',
      description: 'Test',
      nodes: [],
      links: [],
      status: AutomationStatus.IDLE,
      trigger: { type: 'manual', config: {} },
      actions: [{ type: 'agent', agentId: 'agent-1', config: {} }],
    },
    dependencies: {
      agents: [{ id: 'agent-1', name: 'Test Agent', prompt: 'Test', tools: [] }],
      tools: [],
      mcps: [],
    },
  });

  describe('Creation', () => {
    it('should create import from valid export data', () => {
      const exportData = createValidExportData();
      const importEntity = new AutomationImport(exportData);

      expect(importEntity.getAutomationName()).toBe('Test Automation');
      expect(importEntity.getVersion()).toBe('1.0.0');
    });

    it('should create import with options', () => {
      const exportData = createValidExportData();
      const options = { overwrite: true, preserveIds: true };
      
      const importEntity = new AutomationImport(exportData, options);

      expect(importEntity.getOptions()).toEqual(expect.objectContaining(options));
    });

    it('should create from JSON string', () => {
      const exportData = createValidExportData();
      const json = JSON.stringify(exportData);

      const importEntity = AutomationImport.fromJSON(json);

      expect(importEntity.getAutomationName()).toBe('Test Automation');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        AutomationImport.fromJSON('invalid json');
      }).toThrow('Invalid JSON format');
    });

    it('should throw error if automation is missing', () => {
      expect(() => {
        new AutomationImport({
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          automation: null as any,
          dependencies: { agents: [], tools: [], mcps: [] },
        });
      }).toThrow('Automation data is missing');
    });
  });

  describe('Validation', () => {
    it('should validate correct export data', () => {
      const exportData = createValidExportData();
      const importEntity = new AutomationImport(exportData);

      const validation = importEntity.validate();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing name', () => {
      const exportData = createValidExportData();
      exportData.automation.name = '';
      
      expect(() => {
        new AutomationImport(exportData);
      }).toThrow('Automation name is missing');
    });

    it('should detect missing trigger', () => {
      const exportData = createValidExportData();
      exportData.automation.trigger = undefined;
      
      expect(() => {
        new AutomationImport(exportData);
      }).toThrow('Automation trigger is missing');
    });

    it('should detect empty actions', () => {
      const exportData = createValidExportData();
      exportData.automation.actions = [];
      
      const importEntity = new AutomationImport(exportData);
      const validation = importEntity.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Automation must have at least one action');
    });

    it('should warn about version compatibility', () => {
      const exportData = createValidExportData();
      exportData.version = '2.0.0';
      
      const importEntity = new AutomationImport(exportData);
      const validation = importEntity.validate();

      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about missing dependencies', () => {
      const exportData = createValidExportData();
      exportData.dependencies = { agents: [], tools: [], mcps: [] };
      
      const importEntity = new AutomationImport(exportData);
      const validation = importEntity.validate();

      expect(validation.warnings).toContain('No dependencies found');
    });
  });

  describe('Options', () => {
    it('should default overwrite to false', () => {
      const exportData = createValidExportData();
      const importEntity = new AutomationImport(exportData);

      expect(importEntity.getOptions().overwrite).toBe(false);
    });

    it('should default preserveIds to false', () => {
      const exportData = createValidExportData();
      const importEntity = new AutomationImport(exportData);

      expect(importEntity.getOptions().preserveIds).toBe(false);
    });

    it('should default skipDependencies to false', () => {
      const exportData = createValidExportData();
      const importEntity = new AutomationImport(exportData);

      expect(importEntity.getOptions().skipDependencies).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should return metadata if present', () => {
      const exportData = createValidExportData();
      const metadata = { author: 'Test', tags: ['test'] };
      (exportData as any).metadata = metadata;
      
      const importEntity = new AutomationImport(exportData);

      expect(importEntity.getMetadata()).toEqual(metadata);
    });

    it('should return undefined if metadata missing', () => {
      const exportData = createValidExportData();
      const importEntity = new AutomationImport(exportData);

      expect(importEntity.getMetadata()).toBeUndefined();
    });
  });
});
