/**
 * Tool Import Service
 * Gerencia a importação de tools via ZIP
 */

import { IToolRepository } from '../repositories/IToolRepository';
import { Tool, ToolManifest } from '../domain/Tool';
import { ManifestValidator } from '../validators/ManifestValidator';
import { ZipInspector } from '../infra/zip/ZipInspector';
import { SandboxManager } from '../infra/sandbox/SandboxManager';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { AppError } from '@shared/errors';

export interface ImportOptions {
  overwrite?: boolean;
  allowedCapabilities?: string[];
  coreVersion?: string;
  createdBy?: string;
}

export interface ImportResult {
  success: boolean;
  tool?: Tool;
  errors?: string[];
  warnings?: string[];
}

export class ToolImportService {
  constructor(
    private toolRepository: IToolRepository,
    private sandboxManager: SandboxManager
  ) {}

  /**
   * Importa uma tool a partir de um arquivo ZIP
   */
  async import(zipPath: string, options: ImportOptions = {}): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Inspecionar ZIP
      const inspection = await ZipInspector.inspect(zipPath);
      
      if (!inspection.valid) {
        return {
          success: false,
          errors: inspection.errors,
          warnings: inspection.warnings,
        };
      }

      if (inspection.warnings) {
        warnings.push(...inspection.warnings);
      }

      const manifest = inspection.manifest as ToolManifest;

      // 2. Validar manifest
      const validation = ManifestValidator.validate(manifest, options.allowedCapabilities);
      
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map(e => `${e.field}: ${e.message}`),
        };
      }

      if (validation.warnings) {
        warnings.push(...validation.warnings);
      }

      // 3. Verificar compatibilidade
      if (options.coreVersion && !ManifestValidator.isCompatible(manifest, options.coreVersion)) {
        return {
          success: false,
          errors: [`Tool is not compatible with core version ${options.coreVersion}`],
        };
      }

      // 4. Verificar se já existe
      const existing = await this.toolRepository.findByNameAndVersion(
        manifest.name,
        manifest.version
      );

      if (existing && !options.overwrite) {
        throw new AppError(
          `Tool ${manifest.name}@${manifest.version} already exists. Use overwrite=true to replace.`,
          409
        );
      }

      // 5. Criar diretório de sandbox
      const sandboxPath = await this.createSandboxDirectory(manifest.name, manifest.version);

      // 6. Extrair ZIP para sandbox
      await ZipInspector.extract(zipPath, sandboxPath);

      // 7. Criar ou atualizar tool no repositório
      let tool: Tool;
      
      if (existing && options.overwrite) {
        // Atualizar existente
        existing.setSandboxPath(sandboxPath);
        await this.toolRepository.update(existing);
        tool = existing;
      } else {
        // Criar nova
        tool = await this.toolRepository.create({
          name: manifest.name,
          version: manifest.version,
          manifest,
          sandboxPath,
          createdBy: options.createdBy,
        });
      }

      // 8. Executar healthcheck (opcional)
      try {
        await this.runHealthcheck(tool);
        tool.activate();
        await this.toolRepository.update(tool);
      } catch (error) {
        tool.markError();
        await this.toolRepository.update(tool);
        warnings.push(`Healthcheck failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return {
        success: true,
        tool,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Cria diretório de sandbox para a tool
   */
  private async createSandboxDirectory(name: string, version: string): Promise<string> {
    const baseDir = path.join(os.tmpdir(), 'tools-sandbox');
    const toolDir = path.join(baseDir, `${name}-${version}-${Date.now()}`);

    await fs.mkdir(toolDir, { recursive: true });

    return toolDir;
  }

  /**
   * Executa healthcheck da tool
   */
  private async runHealthcheck(tool: Tool): Promise<void> {
    const sandboxPath = tool.getSandboxPath();
    const manifest = tool.getManifest();

    if (!sandboxPath) {
      throw new Error('Sandbox path not set');
    }

    // Executar tool com input vazio para verificar se carrega
    const result = await this.sandboxManager.executeTool(
      sandboxPath,
      manifest.entry,
      {},
      manifest.capabilities,
      5000 // 5s timeout para healthcheck
    );

    if (!result.success) {
      throw new Error(result.error || 'Healthcheck failed');
    }
  }

  /**
   * Remove uma tool
   */
  async delete(toolId: string): Promise<void> {
    const tool = await this.toolRepository.findById(toolId);

    if (!tool) {
      throw new AppError('Tool not found', 404);
    }

    // Remover diretório de sandbox
    const sandboxPath = tool.getSandboxPath();
    if (sandboxPath) {
      try {
        await fs.rm(sandboxPath, { recursive: true, force: true });
      } catch (error) {
        // Log mas não falhar
        console.error('Failed to remove sandbox directory:', error);
      }
    }

    // Remover do repositório
    await this.toolRepository.delete(toolId);
  }

  /**
   * Lista todas as tools
   */
  async listAll(): Promise<Tool[]> {
    return this.toolRepository.findAll();
  }

  /**
   * Lista versões de uma tool
   */
  async listVersions(name: string): Promise<Tool[]> {
    return this.toolRepository.findByName(name);
  }

  /**
   * Busca tool por ID
   */
  async findById(toolId: string): Promise<Tool | null> {
    return this.toolRepository.findById(toolId);
  }
}
