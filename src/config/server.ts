export interface ServerConfig {
  port: number;
  nodeEnv: string;
}

export const serverConfig: ServerConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};
