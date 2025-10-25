import { randomUUID } from 'crypto';
import { SystemTool, ToolType } from '../../domain/SystemTool';

export function createEditTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'Edit',
    description: 'Manipulates text or data with transformations',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        operation: { 
          type: 'string', 
          enum: ['uppercase', 'lowercase', 'trim', 'replace'] 
        },
        find: { type: 'string' },
        replaceWith: { type: 'string' },
      },
      required: ['text', 'operation'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { type: 'string' },
      },
    },
    executor: async (input: unknown) => {
      const { text, operation, find, replaceWith } = input as {
        text: string;
        operation: string;
        find?: string;
        replaceWith?: string;
      };

      let result = text;
      switch (operation) {
        case 'uppercase':
          result = text.toUpperCase();
          break;
        case 'lowercase':
          result = text.toLowerCase();
          break;
        case 'trim':
          result = text.trim();
          break;
        case 'replace':
          if (find && replaceWith !== undefined) {
            result = text.replace(new RegExp(find, 'g'), replaceWith);
          }
          break;
      }

      return { result };
    },
  });
}
