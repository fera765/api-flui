export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export const databaseConfig: DatabaseConfig = {
  type: process.env['DB_TYPE'] || 'memory',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
  database: process.env['DB_DATABASE'] || 'api_backend'
};