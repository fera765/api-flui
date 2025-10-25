import { Request, Response } from 'express';
import { ImportExportService } from '../services/ImportExportService';

export class ImportExportController {
  constructor(private importExportService: ImportExportService) {}

  /**
   * Export single automation
   * GET /api/automations/:id/export
   */
  async exportAutomation(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { author, tags, description } = request.query;

    const metadata = {
      author: author as string | undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      description: description as string | undefined,
    };

    const exportData = await this.importExportService.exportAutomation(id, metadata);

    // Set headers for file download
    response.setHeader('Content-Type', 'application/json');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="automation-${id}-export.json"`
    );

    return response.status(200).json(exportData);
  }

  /**
   * Export all automations
   * GET /api/automations/export/all
   */
  async exportAll(_request: Request, response: Response): Promise<Response> {
    const exportData = await this.importExportService.exportAll();

    response.setHeader('Content-Type', 'application/json');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="all-automations-export.json"`
    );

    return response.status(200).json(exportData);
  }

  /**
   * Validate import data
   * POST /api/automations/import/validate
   */
  async validateImport(request: Request, response: Response): Promise<Response> {
    const { data } = request.body;

    if (!data) {
      return response.status(400).json({
        status: 'error',
        message: 'Import data is required',
      });
    }

    const validation = await this.importExportService.validateImport(data);

    return response.status(200).json(validation);
  }

  /**
   * Import automation
   * POST /api/automations/import
   */
  async importAutomation(request: Request, response: Response): Promise<Response> {
    const { data, options } = request.body;

    if (!data) {
      return response.status(400).json({
        status: 'error',
        message: 'Import data is required',
      });
    }

    const result = await this.importExportService.importAutomation(data, options);

    if (!result.success) {
      return response.status(400).json({
        status: 'error',
        message: result.message,
        errors: result.errors,
      });
    }

    return response.status(201).json({
      status: 'success',
      message: result.message,
      automationId: result.automationId,
      mappedIds: result.mappedIds,
    });
  }
}
