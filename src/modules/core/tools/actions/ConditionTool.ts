import { randomUUID } from 'crypto';
import { SystemTool, ToolType } from '../../domain/SystemTool';

/**
 * Condition Tool - Roteamento Condicional
 * 
 * Funciona como um filtro/switch:
 * - Recebe um input linkado
 * - Compara com as conditions configuradas
 * - Retorna a condition que deu match
 * - O workflow segue pelo handle daquela condition
 */
export function createConditionTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'Condition',
    description: 'Conditional routing based on input value',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Value to evaluate (usually linked from previous node)',
        },
        conditions: {
          type: 'array',
          description: 'List of conditions to check',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
      },
      required: ['input', 'conditions'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        matched: { type: 'boolean', description: 'Whether any condition matched' },
        matchedCondition: {
          type: 'object',
          description: 'The condition that matched',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            value: { type: 'string' },
          },
        },
        originalInput: { type: 'string', description: 'The input value that was evaluated' },
      },
    },
    executor: async (input: unknown) => {
      const { input: inputValue, conditions } = input as {
        input: string;
        conditions: Array<{ id: string; label: string; value: string }>;
      };

      // Find matching condition (case-insensitive comparison)
      const matchedCondition = conditions.find(
        (cond) => cond.value.toLowerCase() === String(inputValue).toLowerCase()
      );

      return {
        matched: !!matchedCondition,
        matchedCondition: matchedCondition || null,
        originalInput: inputValue,
      };
    },
  });
}
