export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const getCurrentTimestamp = (): string => {
  return formatDate(new Date());
};

export * from './asyncHandler';
