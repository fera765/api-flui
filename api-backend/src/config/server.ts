export interface ServerConfig {
  port: number;
  name: string;
  version: string;
  environment: string;
}

export const serverConfig: ServerConfig = {
  port: parseInt(process.env['PORT'] || '3333', 10),
  name: process.env['API_NAME'] || 'API Backend',
  version: process.env['API_VERSION'] || '1.0.0',
  environment: process.env['NODE_ENV'] || 'development'
};