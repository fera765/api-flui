/**
 * Schema utilities and adapters
 * Compatible with Zod-like API
 */

import { Schema, ValidationResult } from './types';

/**
 * Simple schema implementation
 */
export class SimpleSchema<T> implements Schema<T> {
  constructor(
    private validator: (input: unknown) => T,
    private name?: string
  ) {}

  parse(input: unknown): T {
    try {
      return this.validator(input);
    } catch (error) {
      throw new Error(
        `Schema validation failed${this.name ? ` for ${this.name}` : ''}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  safeParse(input: unknown): { success: boolean; data?: T; error?: any } {
    try {
      const data = this.validator(input);
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }
}

/**
 * Schema builders
 */
export const schema = {
  string(): Schema<string> {
    return new SimpleSchema((input) => {
      if (typeof input !== 'string') {
        throw new Error('Expected string');
      }
      return input;
    }, 'string');
  },

  number(): Schema<number> {
    return new SimpleSchema((input) => {
      if (typeof input !== 'number') {
        throw new Error('Expected number');
      }
      return input;
    }, 'number');
  },

  boolean(): Schema<boolean> {
    return new SimpleSchema((input) => {
      if (typeof input !== 'boolean') {
        throw new Error('Expected boolean');
      }
      return input;
    }, 'boolean');
  },

  object<T extends Record<string, any>>(shape: {
    [K in keyof T]: Schema<T[K]>;
  }): Schema<T> {
    return new SimpleSchema((input) => {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw new Error('Expected object');
      }

      const result: any = {};
      for (const key in shape) {
        const schema = shape[key];
        const value = (input as any)[key];
        result[key] = schema.parse(value);
      }
      return result as T;
    }, 'object');
  },

  array<T>(itemSchema: Schema<T>): Schema<T[]> {
    return new SimpleSchema((input) => {
      if (!Array.isArray(input)) {
        throw new Error('Expected array');
      }
      return input.map((item) => itemSchema.parse(item));
    }, 'array');
  },

  optional<T>(innerSchema: Schema<T>): Schema<T | undefined> {
    return new SimpleSchema((input) => {
      if (input === undefined || input === null) {
        return undefined;
      }
      return innerSchema.parse(input);
    }, 'optional');
  },

  any(): Schema<any> {
    return new SimpleSchema((input) => input, 'any');
  },

  literal<T extends string | number | boolean>(value: T): Schema<T> {
    return new SimpleSchema((input) => {
      if (input !== value) {
        throw new Error(`Expected literal value ${value}`);
      }
      return value;
    }, `literal(${value})`);
  },

  union<T extends Schema<any>[]>(...schemas: T): Schema<any> {
    return new SimpleSchema((input) => {
      for (const schema of schemas) {
        const result = schema.safeParse(input);
        if (result.success) {
          return result.data;
        }
      }
      throw new Error('No schema in union matched');
    }, 'union');
  },
};

/**
 * Validate input against schema
 */
export function validate<T>(
  schema: Schema<T>,
  input: unknown
): ValidationResult & { data?: T } {
  const result = schema.safeParse(input);

  if (result.success) {
    return {
      valid: true,
      errors: [],
      data: result.data,
    };
  }

  return {
    valid: false,
    errors: [
      {
        field: 'input',
        message: result.error?.message || 'Validation failed',
        code: 'INVALID_INPUT',
      },
    ],
  };
}
