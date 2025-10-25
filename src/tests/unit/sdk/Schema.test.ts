/**
 * Schema Tests
 * Tests for schema validation and builders
 */

import { schema, validate } from '../../../../sdk/packages/core/src';

describe('Schema', () => {
  describe('String Schema', () => {
    it('should validate string', () => {
      const stringSchema = schema.string();
      const result = stringSchema.safeParse('hello');

      expect(result.success).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should fail non-string', () => {
      const stringSchema = schema.string();
      const result = stringSchema.safeParse(123);

      expect(result.success).toBe(false);
    });

    it('should throw on parse', () => {
      const stringSchema = schema.string();
      expect(() => stringSchema.parse(123)).toThrow(/string/);
    });
  });

  describe('Number Schema', () => {
    it('should validate number', () => {
      const numberSchema = schema.number();
      expect(numberSchema.parse(42)).toBe(42);
    });

    it('should fail non-number', () => {
      const numberSchema = schema.number();
      expect(() => numberSchema.parse('42')).toThrow();
    });
  });

  describe('Boolean Schema', () => {
    it('should validate boolean', () => {
      const boolSchema = schema.boolean();
      expect(boolSchema.parse(true)).toBe(true);
      expect(boolSchema.parse(false)).toBe(false);
    });

    it('should fail non-boolean', () => {
      const boolSchema = schema.boolean();
      expect(() => boolSchema.parse('true')).toThrow();
    });
  });

  describe('Object Schema', () => {
    it('should validate object with shape', () => {
      const objectSchema = schema.object({
        name: schema.string(),
        age: schema.number(),
      });

      const result = objectSchema.parse({ name: 'Alice', age: 30 });

      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should fail with wrong types in object', () => {
      const objectSchema = schema.object({
        name: schema.string(),
        age: schema.number(),
      });

      expect(() => objectSchema.parse({ name: 'Alice', age: '30' })).toThrow();
    });

    it('should fail non-object', () => {
      const objectSchema = schema.object({});
      expect(() => objectSchema.parse('not an object')).toThrow(/object/);
    });

    it('should fail array', () => {
      const objectSchema = schema.object({});
      expect(() => objectSchema.parse([])).toThrow(/object/);
    });
  });

  describe('Array Schema', () => {
    it('should validate array of strings', () => {
      const arraySchema = schema.array(schema.string());
      const result = arraySchema.parse(['a', 'b', 'c']);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should validate array of objects', () => {
      const arraySchema = schema.array(
        schema.object({
          id: schema.number(),
        })
      );

      const result = arraySchema.parse([{ id: 1 }, { id: 2 }]);
      expect(result).toHaveLength(2);
    });

    it('should fail non-array', () => {
      const arraySchema = schema.array(schema.string());
      expect(() => arraySchema.parse('not array')).toThrow(/array/);
    });

    it('should fail with invalid items', () => {
      const arraySchema = schema.array(schema.number());
      expect(() => arraySchema.parse([1, 2, 'three'])).toThrow();
    });
  });

  describe('Optional Schema', () => {
    it('should allow undefined', () => {
      const optionalSchema = schema.optional(schema.string());
      expect(optionalSchema.parse(undefined)).toBeUndefined();
      expect(optionalSchema.parse(null)).toBeUndefined();
    });

    it('should validate defined value', () => {
      const optionalSchema = schema.optional(schema.string());
      expect(optionalSchema.parse('hello')).toBe('hello');
    });
  });

  describe('Any Schema', () => {
    it('should accept any value', () => {
      const anySchema = schema.any();
      expect(anySchema.parse('string')).toBe('string');
      expect(anySchema.parse(123)).toBe(123);
      expect(anySchema.parse({ a: 1 })).toEqual({ a: 1 });
      expect(anySchema.parse(null)).toBeNull();
    });
  });

  describe('Literal Schema', () => {
    it('should validate exact literal value', () => {
      const literalSchema = schema.literal('test');
      expect(literalSchema.parse('test')).toBe('test');
    });

    it('should fail different value', () => {
      const literalSchema = schema.literal('test');
      expect(() => literalSchema.parse('other')).toThrow(/literal/);
    });

    it('should work with numbers', () => {
      const literalSchema = schema.literal(42);
      expect(literalSchema.parse(42)).toBe(42);
      expect(() => literalSchema.parse(43)).toThrow();
    });
  });

  describe('Union Schema', () => {
    it('should validate first matching schema', () => {
      const unionSchema = schema.union(schema.string(), schema.number());
      expect(unionSchema.parse('text')).toBe('text');
      expect(unionSchema.parse(123)).toBe(123);
    });

    it('should fail when no schema matches', () => {
      const unionSchema = schema.union(schema.string(), schema.number());
      expect(() => unionSchema.parse(true)).toThrow(/union/);
    });
  });

  describe('Validate Function', () => {
    it('should return valid result', () => {
      const result = validate(schema.string(), 'hello');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBe('hello');
    });

    it('should return errors for invalid data', () => {
      const result = validate(schema.string(), 123);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Complex Nested Schemas', () => {
    it('should validate complex nested structure', () => {
      const userSchema = schema.object({
        name: schema.string(),
        age: schema.number(),
        email: schema.optional(schema.string()),
        roles: schema.array(schema.string()),
        settings: schema.object({
          theme: schema.literal('dark'),
          notifications: schema.boolean(),
        }),
      });

      const validUser = {
        name: 'Alice',
        age: 30,
        roles: ['admin', 'user'],
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      const result = userSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });
  });
});
