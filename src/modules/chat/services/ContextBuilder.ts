import { ChatContext, AutomationSummary, ToolSummary, AgentSummary } from '../domain/ChatContext';
import { IAutomationRepository } from '@modules/core/repositories/IAutomationRepository';
import { IExecutionLogRepository } from '@modules/core/repositories/IExecutionLogRepository';
import { ISystemToolRepository } from '@modules/core/repositories/ISystemToolRepository';
import { IAgentRepository } from '@modules/core/repositories/IAgentRepository';
import { Automation } from '@modules/core/domain/Automation';
import { AppError } from '@shared/errors';

export class ContextBuilder {
  constructor(
    private automationRepository: IAutomationRepository,
    _executionRepository: IExecutionLogRepository, // Reserved for future use
    private toolRepository: ISystemToolRepository,
    private agentRepository: IAgentRepository
  ) {}

  async buildContext(automationId: string): Promise<ChatContext> {
    // Get automation
    const automation = await this.automationRepository.findById(automationId);
    if (!automation) {
      throw new AppError(`Automation ${automationId} not found`, 404);
    }

    // Get all available action tools (exclude triggers)
    const allTools = await this.toolRepository.findAll();
    const actionTools = allTools.filter(tool => tool.getType() === 'action');

    // Get all agents
    const agents = await this.agentRepository.findAll();

    // Build context
    return new ChatContext({
      automation: this.buildAutomationSummary(automation),
      lastExecution: undefined, // No automation-level execution tracking yet
      availableTools: actionTools.map(tool => this.buildToolSummary(tool)),
      availableAgents: agents.map(agent => this.buildAgentSummary(agent)),
      files: [], // Files will be added dynamically as they are generated
    });
  }

  async updateContext(context: ChatContext, _automationId: string): Promise<ChatContext> {
    // Context update - for now we don't refresh execution data
    // In a real implementation, we'd track automation-level executions
    return context;
  }

  private buildAutomationSummary(automation: Automation): AutomationSummary {
    return {
      id: automation.getId(),
      name: automation.getName(),
      description: automation.getDescription(),
      status: automation.getStatus(),
      nodesCount: automation.getNodes().length,
      linksCount: automation.getLinks().length,
      lastExecutedAt: new Date().toISOString(),
    };
  }

  private buildToolSummary(tool: any): ToolSummary {
    return {
      id: tool.getId(),
      name: tool.getName(),
      description: tool.getDescription(),
      type: tool.getType(),
      inputSchema: tool.getInputSchema(),
      outputSchema: tool.getOutputSchema(),
    };
  }

  private buildAgentSummary(agent: any): AgentSummary {
    return {
      id: agent.getId(),
      name: agent.getName(),
      description: agent.getDescription(),
      prompt: agent.getPrompt(),
      modelId: agent.getDefaultModel(), // Fixed: Agent uses getDefaultModel() not getModel()
    };
  }
}
