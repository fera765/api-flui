/**
 * Tool Import Controller
 * Endpoints para importação e gerenciamento de tools
 */

import { Request, Response } from 'express';
import { ToolImportService } from '../services/ToolImportService';
// import * as path from 'path';
import * as fs from 'fs/promises';

export class ToolImportController {
  constructor(private importService: ToolImportService) {}

  /**
   * POST /api/tools/import
   * Importa uma tool via ZIP
   */
  async import(request: Request, response: Response): Promise<Response> {
    try {
      // Verificar se arquivo foi enviado
      if (!request.file) {
        return response.status(400).json({
          errorCode: 'MISSING_FILE',
          message: 'ZIP file is required',
        });
      }

      const zipPath = request.file.path;
      const overwrite = request.body.overwrite === 'true' || request.body.overwrite === true;

      // Importar
      const result = await this.importService.import(zipPath, {
        overwrite,
        coreVersion: '1.0.0',
        createdBy: (request as any).user?.id,
      });

      // Limpar arquivo temporário
      try {
        await fs.unlink(zipPath);
      } catch (error) {
        // Ignorar erro de cleanup
      }

      if (!result.success) {
        return response.status(400).json({
          errorCode: 'IMPORT_FAILED',
          message: 'Tool import failed',
          errors: result.errors,
          warnings: result.warnings,
        });
      }

      return response.status(201).json({
        id: result.tool!.getId(),
        name: result.tool!.getName(),
        version: result.tool!.getVersion(),
        status: result.tool!.getStatus(),
        warnings: result.warnings,
      });
    } catch (error) {
      // Limpar arquivo se houver erro
      if (request.file) {
        try {
          await fs.unlink(request.file.path);
        } catch {
          // Ignorar
        }
      }

      if (error instanceof Error && error.message.includes('already exists')) {
        return response.status(409).json({
          errorCode: 'CONFLICT',
          message: error.message,
        });
      }

      return response.status(500).json({
        errorCode: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/tools
   * Lista todas as tools
   */
  async listAll(_request: Request, response: Response): Promise<Response> {
    try {
      const tools = await this.importService.listAll();

      return response.status(200).json({
        tools: tools.map(tool => ({
          id: tool.getId(),
          name: tool.getName(),
          version: tool.getVersion(),
          status: tool.getStatus(),
          description: tool.getManifest().description,
          capabilities: tool.getManifest().capabilities,
          createdAt: tool.getCreatedAt(),
        })),
        total: tools.length,
      });
    } catch (error) {
      return response.status(500).json({
        errorCode: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/tools/:id
   * Detalhes de uma tool
   */
  async getById(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const tool = await this.importService.findById(id);

      if (!tool) {
        return response.status(404).json({
          errorCode: 'NOT_FOUND',
          message: 'Tool not found',
        });
      }

      return response.status(200).json(tool.toJSON());
    } catch (error) {
      return response.status(500).json({
        errorCode: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/tools/:id
   * Remove uma tool
   */
  async delete(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;

      await this.importService.delete(id);

      return response.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({
          errorCode: 'NOT_FOUND',
          message: 'Tool not found',
        });
      }

      return response.status(500).json({
        errorCode: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/tools/versions/:name
   * Lista versões de uma tool
   */
  async listVersions(request: Request, response: Response): Promise<Response> {
    try {
      const { name } = request.params;
      const versions = await this.importService.listVersions(name);

      return response.status(200).json({
        name,
        versions: versions.map(tool => ({
          id: tool.getId(),
          version: tool.getVersion(),
          status: tool.getStatus(),
          createdAt: tool.getCreatedAt(),
        })),
        total: versions.length,
      });
    } catch (error) {
      return response.status(500).json({
        errorCode: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
