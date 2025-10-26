export interface AutomationSummary {
  id: string;
  name: string;
  description?: string;
  status: string;
  nodesCount: number;
  linksCount: number;
  lastExecutedAt?: string;
}

export interface ExecutionSummary {
  id: string;
  automationId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
}

export interface ToolSummary {
  id: string;
  name: string;
  description?: string;
  type: string;
  inputSchema?: object;
  outputSchema?: object;
}

export interface AgentSummary {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  modelId?: string;
}

export interface FileSummary {
  path: string;
  name: string;
  size?: number;
  createdAt: string;
}

export interface ChatContextProps {
  automation: AutomationSummary;
  lastExecution?: ExecutionSummary;
  availableTools: ToolSummary[];
  availableAgents: AgentSummary[];
  files: FileSummary[];
}

export class ChatContext {
  private automation: AutomationSummary;
  private lastExecution?: ExecutionSummary;
  private availableTools: ToolSummary[];
  private availableAgents: AgentSummary[];
  private files: FileSummary[];

  constructor(props: ChatContextProps) {
    this.automation = props.automation;
    this.lastExecution = props.lastExecution;
    this.availableTools = props.availableTools;
    this.availableAgents = props.availableAgents;
    this.files = props.files;
  }

  public getAutomation(): AutomationSummary {
    return this.automation;
  }

  public getLastExecution(): ExecutionSummary | undefined {
    return this.lastExecution;
  }

  public getAvailableTools(): ToolSummary[] {
    return this.availableTools;
  }

  public getAvailableAgents(): AgentSummary[] {
    return this.availableAgents;
  }

  public getFiles(): FileSummary[] {
    return this.files;
  }

  public updateLastExecution(execution: ExecutionSummary): void {
    this.lastExecution = execution;
  }

  public addFile(file: FileSummary): void {
    this.files.push(file);
  }

  public toObject(): ChatContextProps {
    return {
      automation: this.automation,
      lastExecution: this.lastExecution,
      availableTools: this.availableTools,
      availableAgents: this.availableAgents,
      files: this.files,
    };
  }

  // Generate system prompt for LLM
  public toSystemPrompt(): string {
    let prompt = `You are an intelligent assistant integrated with an automation system.

**Current Automation Context:**
- Name: ${this.automation.name}
- Description: ${this.automation.description || 'No description'}
- Status: ${this.automation.status}
- Nodes: ${this.automation.nodesCount}
- Links: ${this.automation.linksCount}
`;

    if (this.lastExecution) {
      prompt += `\n**Last Execution:**
- Status: ${this.lastExecution.status}
- Started: ${this.lastExecution.startedAt}
${this.lastExecution.completedAt ? `- Completed: ${this.lastExecution.completedAt}` : ''}
${this.lastExecution.error ? `- Error: ${this.lastExecution.error}` : ''}
${this.lastExecution.result ? `- Result: ${JSON.stringify(this.lastExecution.result, null, 2)}` : ''}
`;
    }

    if (this.availableTools.length > 0) {
      prompt += `\n**Available Tools (${this.availableTools.length}):**\n`;
      this.availableTools.forEach(tool => {
        prompt += `- ${tool.name} (${tool.type}): ${tool.description || 'No description'}\n`;
      });
    }

    if (this.availableAgents.length > 0) {
      prompt += `\n**Available Agents (${this.availableAgents.length}):**\n`;
      this.availableAgents.forEach(agent => {
        prompt += `- ${agent.name}: ${agent.description || 'No description'}\n`;
      });
    }

    if (this.files.length > 0) {
      prompt += `\n**Generated Files (${this.files.length}):**\n`;
      this.files.forEach(file => {
        prompt += `- ${file.name} (${file.path})\n`;
      });
    }

    prompt += `\n**Your Capabilities:**
- Answer questions about the automation
- Explain the execution flow
- Execute the automation with new parameters
- Call available tools to perform actions
- Generate reports, summaries, and new content
- Access and analyze execution logs and results

**Guidelines:**
- Be helpful, clear, and concise
- When executing actions, explain what you're doing
- If you need more information, ask the user
- Use the available tools when appropriate
- Format your responses in a user-friendly way
`;

    return prompt;
  }
}
