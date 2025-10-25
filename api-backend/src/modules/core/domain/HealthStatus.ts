export class HealthStatus {
  public readonly message: string;
  public readonly version: string;
  public readonly environment: string;
  public readonly timestamp: Date;

  constructor(
    message: string = 'API is running',
    version: string = '1.0.0',
    environment: string = 'development'
  ) {
    this.message = message;
    this.version = version;
    this.environment = environment;
    this.timestamp = new Date();
  }
}