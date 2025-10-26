/**
 * Tool Entity
 * Representa uma tool importada via TOR (Tool Onboarding Registry)
 */

import { randomUUID } from 'crypto';

export enum ToolStatus {
  STAGED = 'staged',       // Importada, validada, aguardando ativação
  ACTIVE = 'active',       // Ativa e pronta para execução
  INACTIVE = 'inactive',   // Desativada
  ERROR = 'error',         // Erro na ativação
}

export interface ToolManifest {
  name: string;
  version: string;
  entry: string;
  type: 'tool';
  description?: string;
  capabilities?: string[];
  inputSchema?: any;
  outputSchema: any; // OBRIGATÓRIO
  compatibility?: {
    coreMin?: string;
    coreMax?: string;
  };
}

export interface ToolProps {
  id: string;
  name: string;
  version: string;
  manifest: ToolManifest;
  status: ToolStatus;
  sandboxPath?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateToolProps {
  name: string;
  version: string;
  manifest: ToolManifest;
  sandboxPath?: string;
  createdBy?: string;
}

export class Tool {
  private readonly id: string;
  private name: string;
  private version: string;
  private manifest: ToolManifest;
  private status: ToolStatus;
  private sandboxPath?: string;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private createdBy?: string;

  constructor(props: ToolProps) {
    this.id = props.id;
    this.name = props.name;
    this.version = props.version;
    this.manifest = props.manifest;
    this.status = props.status;
    this.sandboxPath = props.sandboxPath;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.createdBy = props.createdBy;
  }

  public static create(props: CreateToolProps): Tool {
    return new Tool({
      id: randomUUID(),
      name: props.name,
      version: props.version,
      manifest: props.manifest,
      status: ToolStatus.STAGED,
      sandboxPath: props.sandboxPath,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: props.createdBy,
    });
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getVersion(): string {
    return this.version;
  }

  public getManifest(): ToolManifest {
    return this.manifest;
  }

  public getStatus(): ToolStatus {
    return this.status;
  }

  public getSandboxPath(): string | undefined {
    return this.sandboxPath;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getCreatedBy(): string | undefined {
    return this.createdBy;
  }

  // State transitions
  public activate(): void {
    if (this.status !== ToolStatus.STAGED) {
      throw new Error(`Cannot activate tool in status ${this.status}`);
    }
    this.status = ToolStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.status = ToolStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  public markError(): void {
    this.status = ToolStatus.ERROR;
    this.updatedAt = new Date();
  }

  public setSandboxPath(path: string): void {
    this.sandboxPath = path;
    this.updatedAt = new Date();
  }

  // Serialization
  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      manifest: this.manifest,
      status: this.status,
      sandboxPath: this.sandboxPath,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      createdBy: this.createdBy,
    };
  }
}
