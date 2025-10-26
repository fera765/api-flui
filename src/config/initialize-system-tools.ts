/**
 * System Tools Initialization
 * Registers all native system tools on application startup
 */

import { systemToolRepository } from '@shared/repositories/singletons';

// Triggers
import { createManualTriggerTool } from '@modules/core/tools/triggers/ManualTriggerTool';
import { createWebHookTriggerTool } from '@modules/core/tools/triggers/WebHookTriggerTool';
import { createCronTriggerTool } from '@modules/core/tools/triggers/CronTriggerTool';

// Actions - File
import {
  createWriteFileTool,
  createReadFileTool,
  createReadFolderTool,
  createFindFilesTool,
  createReadManyFilesTool,
  createSearchTextTool,
} from '@modules/core/tools/actions/FileTool';

// Actions - Others
import { createWebFetchTool } from '@modules/core/tools/actions/WebFetchTool';
import { createShellTool } from '@modules/core/tools/actions/ShellTool';
import { createEditTool } from '@modules/core/tools/actions/EditTool';

/**
 * Initialize all native system tools
 * This should be called once when the application starts
 */
export async function initializeSystemTools(): Promise<void> {
  try {
    // Check if tools already initialized
    const existingTools = await systemToolRepository.findAll();
    if (existingTools.length > 0) {
      return; // Already initialized
    }

    // Triggers
    await systemToolRepository.create({
      ...createManualTriggerTool().toJSON(),
      executor: createManualTriggerTool().execute.bind(createManualTriggerTool()),
    } as any);

    await systemToolRepository.create({
      ...createWebHookTriggerTool('POST').toJSON(),
      executor: createWebHookTriggerTool('POST').execute.bind(createWebHookTriggerTool('POST')),
    } as any);

    await systemToolRepository.create({
      ...createCronTriggerTool('0 * * * *').toJSON(),
      executor: createCronTriggerTool('0 * * * *').execute.bind(createCronTriggerTool('0 * * * *')),
    } as any);

    // File Actions
    await systemToolRepository.create({
      ...createWriteFileTool().toJSON(),
      executor: createWriteFileTool().execute.bind(createWriteFileTool()),
    } as any);

    await systemToolRepository.create({
      ...createReadFileTool().toJSON(),
      executor: createReadFileTool().execute.bind(createReadFileTool()),
    } as any);

    await systemToolRepository.create({
      ...createReadFolderTool().toJSON(),
      executor: createReadFolderTool().execute.bind(createReadFolderTool()),
    } as any);

    await systemToolRepository.create({
      ...createFindFilesTool().toJSON(),
      executor: createFindFilesTool().execute.bind(createFindFilesTool()),
    } as any);

    await systemToolRepository.create({
      ...createReadManyFilesTool().toJSON(),
      executor: createReadManyFilesTool().execute.bind(createReadManyFilesTool()),
    } as any);

    await systemToolRepository.create({
      ...createSearchTextTool().toJSON(),
      executor: createSearchTextTool().execute.bind(createSearchTextTool()),
    } as any);

    // Other Actions
    await systemToolRepository.create({
      ...createWebFetchTool().toJSON(),
      executor: createWebFetchTool().execute.bind(createWebFetchTool()),
    } as any);

    await systemToolRepository.create({
      ...createShellTool().toJSON(),
      executor: createShellTool().execute.bind(createShellTool()),
    } as any);

    await systemToolRepository.create({
      ...createEditTool().toJSON(),
      executor: createEditTool().execute.bind(createEditTool()),
    } as any);
  } catch (error) {
    console.error('Error initializing system tools:', error);
  }
}
