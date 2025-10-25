import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found'
  });
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'Unknown error'
  });
}