/**
 * Cron Adapter
 * Adapter for scheduling recurring tasks
 */

import type { AdapterDefinition } from '../../core/src/types';

export interface CronConfig {
  schedule: string;
  timezone?: string;
  enabled?: boolean;
}

export interface CronJob {
  id: string;
  schedule: string;
  handler: () => void | Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

/**
 * Cron Adapter implementation
 * Note: This is a simplified implementation for demonstration
 */
export class CronAdapter implements AdapterDefinition<CronConfig> {
  name = 'cron';
  version = '1.0.0';
  type = 'cron' as const;
  config?: CronConfig;
  private jobs = new Map<string, CronJob>();
  private intervals = new Map<string, NodeJS.Timeout>();

  async initialize(config: CronConfig): Promise<void> {
    this.config = {
      enabled: true,
      ...config,
    };
  }

  async execute<I extends CronConfig, O>(input: I): Promise<O> {
    // Mock execute - in real implementation would parse cron expression
    return { scheduled: true, nextRun: new Date() } as O;
  }

  /**
   * Schedule a cron job
   */
  schedule(id: string, schedule: string, handler: () => void | Promise<void>): void {
    if (this.jobs.has(id)) {
      throw new Error(`Cron job with id "${id}" already exists`);
    }

    const job: CronJob = {
      id,
      schedule,
      handler,
      isRunning: false,
      nextRun: this.calculateNextRun(schedule),
    };

    this.jobs.set(id, job);

    // Simplified: run every minute (in real impl, parse cron expression)
    const interval = setInterval(async () => {
      if (job.isRunning) return;

      job.isRunning = true;
      job.lastRun = new Date();

      try {
        await handler();
      } catch (error) {
        console.error(`Cron job "${id}" failed:`, error);
      } finally {
        job.isRunning = false;
        job.nextRun = this.calculateNextRun(schedule);
      }
    }, 60000); // Every minute

    this.intervals.set(id, interval);
  }

  /**
   * Unschedule a cron job
   */
  unschedule(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
    this.jobs.delete(id);
  }

  /**
   * List all scheduled jobs
   */
  listJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  async cleanup(): Promise<void> {
    for (const [id, interval] of this.intervals.entries()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.jobs.clear();
  }

  private calculateNextRun(schedule: string): Date {
    // Simplified - in real implementation, parse cron expression
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1);
    return next;
  }
}

/**
 * Create cron adapter
 */
export function createCronAdapter(config?: CronConfig): CronAdapter {
  const adapter = new CronAdapter();
  if (config) {
    adapter.initialize(config);
  }
  return adapter;
}
