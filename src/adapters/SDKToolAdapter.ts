/**
 * SDK Tool Adapter
 * Converte SDK Tools para SystemTools e gerencia integração
 */

import { SystemTool, ToolType } from '@modules/core/domain/SystemTool';
import { ISystemToolRepository } from '@modules/core/repositories/ISystemToolRepository';
import { createSDK } from '../../sdk/packages/core/src';
import type { ToolDefinition } from '../../sdk/packages/core/src/types';

export interface SDKToolRegistration {
  sdkId: string;
  systemId: string;
  name: string;
}

/**
 * Adapter que converte SDK Tools para SystemTools
 */
export class SDKToolAdapter {
  private sdk = createSDK();
  private sdkToSystemMap = new Map<string, string>(); // sdkId → systemId

  constructor(private toolRepository: ISystemToolRepository) {}

  /**
   * Registra uma SDK Tool e cria um SystemTool correspondente
   */
  async registerSDKTool(sdkTool: ToolDefinition<any, any>): Promise<SDKToolRegistration> {
    // 1. Registrar no SDK
    const sdkResult = await this.sdk.registerTool(sdkTool);
    
    if (!sdkResult.success) {
      throw new Error(`Failed to register SDK tool: ${sdkResult.errors?.join(', ')}`);
    }

    const sdkId = sdkResult.id;

    // 2. Criar SystemTool wrapper
    const systemTool = await this.toolRepository.create({
      name: sdkTool.name,
      description: sdkTool.description || `SDK Tool: ${sdkTool.name}`,
      type: ToolType.ACTION,
      config: {
        sdkToolId: sdkId,
        capabilities: sdkTool.capabilities || [],
        version: sdkTool.version,
      },
    });

    // 3. Override executor para chamar SDK
    const originalExecutor = systemTool.getExecutor();
    const sdkExecutor = async (input: any) => {
      const result = await this.sdk.executeTool(sdkId, input);
      
      if (!result.success) {
        throw new Error(result.error || 'SDK tool execution failed');
      }
      
      return result.output;
    };

    // Replace executor (via reflection)
    (systemTool as any).executor = sdkExecutor;

    // 4. Mapear IDs
    this.sdkToSystemMap.set(sdkId, systemTool.getId());

    return {
      sdkId,
      systemId: systemTool.getId(),
      name: sdkTool.name,
    };
  }

  /**
   * Registra múltiplas SDK tools
   */
  async registerMultiple(sdkTools: ToolDefinition<any, any>[]): Promise<SDKToolRegistration[]> {
    const registrations: SDKToolRegistration[] = [];
    
    for (const tool of sdkTools) {
      const registration = await this.registerSDKTool(tool);
      registrations.push(registration);
    }
    
    return registrations;
  }

  /**
   * Busca SystemTool pelo SDK Tool ID
   */
  async getSystemToolBySdkId(sdkId: string): Promise<SystemTool | null> {
    const systemId = this.sdkToSystemMap.get(sdkId);
    if (!systemId) return null;
    
    return await this.toolRepository.findById(systemId);
  }

  /**
   * Busca SystemTool pelo nome
   */
  async getSystemToolByName(name: string): Promise<SystemTool | null> {
    const allTools = await this.toolRepository.findAll();
    return allTools.find(tool => tool.getName() === name) || null;
  }

  /**
   * Lista todas as SDK tools registradas
   */
  async listSDKTools(): Promise<SDKToolRegistration[]> {
    const sdkTools = await this.sdk.listTools();
    return sdkTools.map(tool => ({
      sdkId: tool.id,
      systemId: this.sdkToSystemMap.get(tool.id) || tool.id,
      name: tool.name,
    }));
  }

  /**
   * Executa SDK tool diretamente
   */
  async executeTool<I, O>(sdkId: string, input: I): Promise<O> {
    const result = await this.sdk.executeTool<I, O>(sdkId, input);
    
    if (!result.success) {
      throw new Error(result.error || 'Execution failed');
    }
    
    return result.output!;
  }

  /**
   * Remove SDK tool
   */
  async unregisterSDKTool(sdkId: string): Promise<void> {
    await this.sdk.unregisterTool(sdkId);
    this.sdkToSystemMap.delete(sdkId);
  }

  /**
   * Acesso ao SDK interno
   */
  getSDK() {
    return this.sdk;
  }

  /**
   * Acesso ao repository
   */
  getRepository() {
    return this.toolRepository;
  }
}
