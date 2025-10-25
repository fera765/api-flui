export enum NodeType {
  TRIGGER = 'trigger',
  AGENT = 'agent',
  TOOL = 'tool',
}

export enum AutomationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface NodeProps {
  id: string;
  type: NodeType;
  referenceId: string;
  config?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
}

export interface NodeResponse {
  id: string;
  type: NodeType;
  referenceId: string;
  config?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
}

export class Node {
  private readonly id: string;
  private readonly type: NodeType;
  private readonly referenceId: string;
  private config?: Record<string, unknown>;
  private outputs?: Record<string, unknown>;

  constructor(props: NodeProps) {
    this.id = props.id;
    this.type = props.type;
    this.referenceId = props.referenceId;
    this.config = props.config;
    this.outputs = props.outputs;
  }

  public getId(): string {
    return this.id;
  }

  public getType(): NodeType {
    return this.type;
  }

  public getReferenceId(): string {
    return this.referenceId;
  }

  public getConfig(): Record<string, unknown> | undefined {
    return this.config;
  }

  public getOutputs(): Record<string, unknown> | undefined {
    return this.outputs;
  }

  public setOutputs(outputs: Record<string, unknown>): void {
    this.outputs = outputs;
  }

  public updateConfig(config: Record<string, unknown>): void {
    this.config = { ...this.config, ...config };
  }

  public toJSON(): NodeResponse {
    return {
      id: this.id,
      type: this.type,
      referenceId: this.referenceId,
      config: this.config,
      outputs: this.outputs,
    };
  }
}

export interface LinkProps {
  fromNodeId: string;
  fromOutputKey: string;
  toNodeId: string;
  toInputKey: string;
}

export interface LinkResponse {
  fromNodeId: string;
  fromOutputKey: string;
  toNodeId: string;
  toInputKey: string;
}

export class Link {
  private readonly fromNodeId: string;
  private readonly fromOutputKey: string;
  private readonly toNodeId: string;
  private readonly toInputKey: string;

  constructor(props: LinkProps) {
    this.fromNodeId = props.fromNodeId;
    this.fromOutputKey = props.fromOutputKey;
    this.toNodeId = props.toNodeId;
    this.toInputKey = props.toInputKey;
  }

  public getFromNodeId(): string {
    return this.fromNodeId;
  }

  public getFromOutputKey(): string {
    return this.fromOutputKey;
  }

  public getToNodeId(): string {
    return this.toNodeId;
  }

  public getToInputKey(): string {
    return this.toInputKey;
  }

  public toJSON(): LinkResponse {
    return {
      fromNodeId: this.fromNodeId,
      fromOutputKey: this.fromOutputKey,
      toNodeId: this.toNodeId,
      toInputKey: this.toInputKey,
    };
  }
}

export interface AutomationProps {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  links: Link[];
  status: AutomationStatus;
}

export interface AutomationResponse {
  id: string;
  name: string;
  description?: string;
  nodes: NodeResponse[];
  links: LinkResponse[];
  status: AutomationStatus;
}

export interface CreateAutomationProps {
  name: string;
  description?: string;
  nodes: NodeProps[];
  links: LinkProps[];
}

export interface UpdateAutomationProps {
  name?: string;
  description?: string;
  nodes?: NodeProps[];
  links?: LinkProps[];
}

export class Automation {
  private readonly id: string;
  private name: string;
  private description?: string;
  private nodes: Node[];
  private links: Link[];
  private status: AutomationStatus;

  constructor(props: AutomationProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.nodes = props.nodes;
    this.links = props.links;
    this.status = props.status;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public getNodes(): Node[] {
    return this.nodes;
  }

  public getLinks(): Link[] {
    return this.links;
  }

  public getStatus(): AutomationStatus {
    return this.status;
  }

  public setStatus(status: AutomationStatus): void {
    this.status = status;
  }

  public update(props: UpdateAutomationProps): void {
    if (props.name !== undefined) {
      this.name = props.name;
    }
    if (props.description !== undefined) {
      this.description = props.description;
    }
    if (props.nodes !== undefined) {
      this.nodes = props.nodes.map(nodeProps => new Node(nodeProps));
    }
    if (props.links !== undefined) {
      this.links = props.links.map(linkProps => new Link(linkProps));
    }
  }

  public getNodeById(nodeId: string): Node | undefined {
    return this.nodes.find(node => node.getId() === nodeId);
  }

  public getLinksForNode(nodeId: string): Link[] {
    return this.links.filter(link => link.getFromNodeId() === nodeId);
  }

  public getTriggerNodes(): Node[] {
    return this.nodes.filter(node => node.getType() === NodeType.TRIGGER);
  }

  public toJSON(): AutomationResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      nodes: this.nodes.map(node => node.toJSON()),
      links: this.links.map(link => link.toJSON()),
      status: this.status,
    };
  }
}
