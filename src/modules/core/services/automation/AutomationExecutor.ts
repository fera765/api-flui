import { Automation, Node, NodeType, AutomationStatus } from '../../domain/Automation';
import { ISystemToolRepository } from '../../repositories/ISystemToolRepository';
import { IAgentRepository } from '../../repositories/IAgentRepository';
import { IConditionToolRepository } from '../../repositories/IConditionToolRepository';
import { ConditionNodeExecutor } from './ConditionNodeExecutor';
import { AppError } from '@shared/errors';

export interface ExecutionContext {
  automationId: string;
  executedNodes: Map<string, Record<string, unknown>>;
  errors: Map<string, Error>;
}

export interface NodeExecutionResult {
  nodeId: string;
  outputs: Record<string, unknown>;
  status: 'success' | 'error';
  error?: string;
  conditionId?: string;
  conditionName?: string;
  linkedNodes?: string[];
}

export type NodeExecutionListener = (result: NodeExecutionResult) => void;

export interface IAutomationExecutor {
  execute(automation: Automation, initialInput?: Record<string, unknown>): Promise<ExecutionContext>;
  addListener(listener: NodeExecutionListener): void;
  removeListener(listener: NodeExecutionListener): void;
}

export class AutomationExecutor implements IAutomationExecutor {
  private listeners: NodeExecutionListener[] = [];
  private conditionExecutor?: ConditionNodeExecutor;

  constructor(
    private readonly toolRepository: ISystemToolRepository,
    private readonly agentRepository: IAgentRepository,
    conditionToolRepository?: IConditionToolRepository
  ) {
    if (conditionToolRepository) {
      this.conditionExecutor = new ConditionNodeExecutor(conditionToolRepository);
    }
  }

  public addListener(listener: NodeExecutionListener): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: NodeExecutionListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(result: NodeExecutionResult): void {
    this.listeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        // Ignore listener errors to prevent execution disruption
      }
    });
  }

  public async execute(
    automation: Automation,
    initialInput?: Record<string, unknown>
  ): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      automationId: automation.getId(),
      executedNodes: new Map(),
      errors: new Map(),
    };

    automation.setStatus(AutomationStatus.RUNNING);

    try {
      // Get trigger nodes to start execution
      const triggerNodes = automation.getTriggerNodes();

      if (triggerNodes.length === 0) {
        throw new AppError('Automation must have at least one trigger node', 400);
      }

      // Execute all trigger nodes in parallel
      await Promise.all(
        triggerNodes.map(triggerNode => this.executeNode(triggerNode, automation, context, initialInput))
      );

      automation.setStatus(AutomationStatus.COMPLETED);
    } catch (error) {
      automation.setStatus(AutomationStatus.ERROR);
      throw error;
    }

    return context;
  }

  private async executeNode(
    node: Node,
    automation: Automation,
    context: ExecutionContext,
    input?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Prepare input by merging node config and provided input
      const nodeInput = {
        ...node.getConfig(),
        ...input,
      };

      // Execute based on node type
      let outputs: Record<string, unknown>;

      switch (node.getType()) {
        case NodeType.TRIGGER:
          outputs = await this.executeTriggerNode(node, nodeInput);
          break;
        case NodeType.TOOL:
          outputs = await this.executeToolNode(node, nodeInput);
          break;
        case NodeType.AGENT:
          outputs = await this.executeAgentNode(node, nodeInput);
          break;
        case NodeType.CONDITION:
          await this.executeConditionNode(node, automation, context, nodeInput);
          return; // Condition node handles its own routing
        default:
          throw new Error(`Unknown node type: ${node.getType()}`);
      }

      // Store outputs
      node.setOutputs(outputs);
      context.executedNodes.set(node.getId(), outputs);

      // Notify listeners
      this.notifyListeners({
        nodeId: node.getId(),
        outputs,
        status: 'success',
      });

      // Execute connected nodes
      await this.executeConnectedNodes(node, automation, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.errors.set(node.getId(), error instanceof Error ? error : new Error(errorMessage));

      this.notifyListeners({
        nodeId: node.getId(),
        outputs: {},
        status: 'error',
        error: errorMessage,
      });

      throw error;
    }
  }

  private async executeTriggerNode(
    node: Node,
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const tool = await this.toolRepository.findById(node.getReferenceId());

    if (!tool) {
      throw new AppError(`Trigger tool not found: ${node.getReferenceId()}`, 404);
    }

    const result = await tool.execute(input);
    return typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : { result };
  }

  private async executeToolNode(
    node: Node,
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const tool = await this.toolRepository.findById(node.getReferenceId());

    if (!tool) {
      throw new AppError(`Tool not found: ${node.getReferenceId()}`, 404);
    }

    const result = await tool.execute(input);
    return typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : { result };
  }

  private async executeAgentNode(
    node: Node,
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const agent = await this.agentRepository.findById(node.getReferenceId());

    if (!agent) {
      throw new AppError(`Agent not found: ${node.getReferenceId()}`, 404);
    }

    // For now, return agent info with input as a placeholder for actual agent execution
    // In a real implementation, this would call the agent's LLM and execute tools
    return {
      agentId: agent.getId(),
      agentName: agent.getName(),
      input,
      response: 'Agent execution placeholder - would integrate with LLM here',
    };
  }

  private async executeConditionNode(
    node: Node,
    automation: Automation,
    context: ExecutionContext,
    input: Record<string, unknown>
  ): Promise<void> {
    if (!this.conditionExecutor) {
      throw new AppError('ConditionToolRepository not configured', 500);
    }

    const result = await this.conditionExecutor.execute(node, input);

    // Store outputs
    node.setOutputs(result.outputs);
    context.executedNodes.set(node.getId(), result.outputs);

    // Notify listeners with condition info
    this.notifyListeners({
      nodeId: node.getId(),
      outputs: result.outputs,
      status: 'success',
      conditionId: result.satisfiedCondition?.conditionId,
      conditionName: result.satisfiedCondition?.conditionName,
      linkedNodes: result.satisfiedCondition?.linkedNodes,
    });

    // Execute only the nodes linked to the satisfied condition
    if (result.satisfiedCondition && result.satisfiedCondition.linkedNodes.length > 0) {
      const linkedNodeExecutions = result.satisfiedCondition.linkedNodes.map(async nodeId => {
        const targetNode = automation.getNodeById(nodeId);

        if (!targetNode) {
          console.warn(`Linked node not found: ${nodeId}`);
          return;
        }

        // Check if node was already executed (avoid infinite loops)
        if (context.executedNodes.has(targetNode.getId())) {
          return;
        }

        // Pass the outputs from the condition evaluation
        await this.executeNode(targetNode, automation, context, result.outputs);
      });

      await Promise.all(linkedNodeExecutions);
    }
  }

  private async executeConnectedNodes(
    node: Node,
    automation: Automation,
    context: ExecutionContext
  ): Promise<void> {
    const links = automation.getLinksForNode(node.getId());

    if (links.length === 0) {
      return;
    }

    const outputs = node.getOutputs() || {};

    // Execute connected nodes in parallel
    const connectedExecutions = links.map(async link => {
      const targetNode = automation.getNodeById(link.getToNodeId());

      if (!targetNode) {
        throw new AppError(`Target node not found: ${link.getToNodeId()}`, 404);
      }

      // Check if node was already executed (avoid infinite loops)
      if (context.executedNodes.has(targetNode.getId())) {
        return;
      }

      // Map output to input
      const mappedInput: Record<string, unknown> = {};
      const outputValue = outputs[link.getFromOutputKey()];

      if (outputValue !== undefined) {
        mappedInput[link.getToInputKey()] = outputValue;
      } else {
        // If specific key not found, pass all outputs
        Object.assign(mappedInput, outputs);
      }

      // Execute target node
      await this.executeNode(targetNode, automation, context, mappedInput);
    });

    await Promise.all(connectedExecutions);
  }
}
