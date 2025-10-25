import { formatDate, getCurrentTimestamp } from '@shared/utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = formatDate(date);

      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle current date', () => {
      const date = new Date();
      const result = formatDate(date);

      expect(new Date(result).toString()).not.toBe('Invalid Date');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return current timestamp in ISO format', () => {
      const result = getCurrentTimestamp();

      expect(typeof result).toBe('string');
      expect(new Date(result).toString()).not.toBe('Invalid Date');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return different timestamps on consecutive calls', async () => {
      const timestamp1 = getCurrentTimestamp();
      await new Promise(resolve => setTimeout(resolve, 10));
      const timestamp2 = getCurrentTimestamp();

      expect(timestamp1).not.toBe(timestamp2);
    });
  });
});
