/**
 * HTTP Adapter
 * Adapter for making HTTP requests from tools
 */

import type { AdapterDefinition } from '../../core/src/types';
import { SDKError, SDKErrorCode } from '../../core/src/types';

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
}

export interface HttpRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

/**
 * HTTP Adapter implementation
 */
export class HttpAdapter implements AdapterDefinition<HttpConfig> {
  name = 'http';
  version = '1.0.0';
  type = 'http' as const;
  config?: HttpConfig;

  async initialize(config: HttpConfig): Promise<void> {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  async execute<I extends HttpRequest, O>(input: I): Promise<HttpResponse<O>> {
    const url = this.buildURL(input.url, input.params);
    const method = input.method || 'GET';
    const headers = { ...this.config?.headers, ...input.headers };
    const timeout = this.config?.timeout || 30000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: input.body ? JSON.stringify(input.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: this.extractHeaders(response.headers),
      };
    } catch (error) {
      throw new SDKError(
        SDKErrorCode.EXECUTION_FAILED,
        `HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup any persistent connections
  }

  private buildURL(url: string, params?: Record<string, string>): string {
    const base = this.config?.baseURL || '';
    const fullURL = base + url;

    if (!params || Object.keys(params).length === 0) {
      return fullURL;
    }

    const searchParams = new URLSearchParams(params);
    return `${fullURL}?${searchParams.toString()}`;
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

/**
 * Create HTTP adapter
 */
export function createHttpAdapter(config?: HttpConfig): HttpAdapter {
  const adapter = new HttpAdapter();
  if (config) {
    adapter.initialize(config);
  }
  return adapter;
}
