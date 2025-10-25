export interface SystemConfigProps {
  endpoint: string;
  apiKey?: string;
  model: string;
}

export interface SystemConfigResponse {
  endpoint: string;
  apiKey?: string;
  model: string;
}

export class SystemConfig {
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(props: SystemConfigProps) {
    this.endpoint = props.endpoint;
    this.apiKey = props.apiKey;
    this.model = props.model;
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public getApiKey(): string | undefined {
    return this.apiKey;
  }

  public getModel(): string {
    return this.model;
  }

  public toJSON(): SystemConfigResponse {
    return {
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      model: this.model,
    };
  }
}
