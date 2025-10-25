export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

export class HealthCheck {
  private readonly status: string;
  private readonly message: string;
  private readonly timestamp: string;

  constructor(status: string, message: string, timestamp: string) {
    this.status = status;
    this.message = message;
    this.timestamp = timestamp;
  }

  public toJSON(): HealthCheckResponse {
    return {
      status: this.status,
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}
