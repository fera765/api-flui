/**
 * Sistema Universal de Renderização de Campos
 * Framework padronizado para garantir UI consistente
 */

export type FieldType = 
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'object'
  | 'array-of-objects'
  | 'array-simple'
  | 'json';

export interface FieldSchema {
  type: FieldType;
  title?: string;
  description?: string;
  default?: any;
  enum?: string[];
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface LinkedField {
  sourceNodeId: string;
  sourceNodeName: string;
  outputKey: string;
  outputType: string;
}

export interface FieldValue {
  value: any;
  isLinked: boolean;
  linkedField?: LinkedField;
}

export interface AvailableOutput {
  nodeId: string;
  nodeName: string;
  outputs: Array<{
    key: string;
    type: string;
    description?: string;
  }>;
}

export interface FieldRendererProps {
  fieldKey: string;
  schema: FieldSchema;
  value: any;
  isLinked: boolean;
  linkedField?: LinkedField;
  isRequired: boolean;
  error?: string;
  availableOutputs?: AvailableOutput[];
  onChange: (value: any) => void;
  onLink?: (sourceNodeId: string, outputKey: string) => void;
  onUnlink?: () => void;
  disabled?: boolean;
}
