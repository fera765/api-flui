/**
 * Shared Repository Singletons
 * 
 * Este arquivo garante que todas as instâncias in-memory dos repositórios
 * sejam compartilhadas entre os diferentes módulos da aplicação.
 * 
 * IMPORTANTE: Sempre importe deste arquivo para garantir que você está
 * usando a mesma instância em toda a aplicação.
 */

import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { ExecutionLogRepositoryInMemory } from '@modules/core/repositories/ExecutionLogRepositoryInMemory';
import { SystemConfigRepositoryInMemory } from '@modules/core/repositories/SystemConfigRepositoryInMemory';
import { MCPRepositoryInMemory } from '@modules/core/repositories/MCPRepositoryInMemory';

// Singleton instances - criadas uma única vez
export const automationRepository = new AutomationRepositoryInMemory();
export const agentRepository = new AgentRepositoryInMemory();
export const systemToolRepository = new SystemToolRepositoryInMemory();
export const executionLogRepository = new ExecutionLogRepositoryInMemory();
export const systemConfigRepository = new SystemConfigRepositoryInMemory();
export const mcpRepository = new MCPRepositoryInMemory();

/**
 * Função para limpar todos os repositórios (útil para testes)
 */
export function clearAllRepositories(): void {
  automationRepository.clear();
  agentRepository.clear();
  systemToolRepository.clear();
  executionLogRepository.clear();
  systemConfigRepository.clear();
  mcpRepository.clear();
}
