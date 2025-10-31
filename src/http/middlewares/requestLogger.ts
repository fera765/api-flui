/**
 * Request Logger Middleware
 * Logs all incoming requests and outgoing responses with payloads
 */

import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Log request
  console.log('\n' + '='.repeat(80));
  console.log(`📥 [REQUEST ${requestId}] ${req.method} ${req.path}`);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔍 Query:', JSON.stringify(req.query, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔑 Headers:', JSON.stringify({
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? '[PRESENT]' : '[NONE]',
  }, null, 2));

  // Capture original json method
  const originalJson = res.json.bind(res);

  // Override json to log response
  res.json = function(body: unknown): Response {
    const duration = Date.now() - startTime;
    
    console.log('─'.repeat(80));
    console.log(`📤 [RESPONSE ${requestId}] ${req.method} ${req.path}`);
    console.log('⏱️  Duration:', `${duration}ms`);
    console.log('📊 Status:', res.statusCode);
    console.log('📦 Response Body:', JSON.stringify(body, null, 2));
    console.log('='.repeat(80) + '\n');
    
    return originalJson(body);
  };
  
  // Capture original send method for non-JSON responses
  const originalSend = res.send.bind(res);
  res.send = function(body: unknown): Response {
    const duration = Date.now() - startTime;
    
    // Only log if not already logged by json()
    if (res.statusCode === 204 || typeof body !== 'object') {
      console.log('─'.repeat(80));
      console.log(`📤 [RESPONSE ${requestId}] ${req.method} ${req.path}`);
      console.log('⏱️  Duration:', `${duration}ms`);
      console.log('📊 Status:', res.statusCode);
      console.log('📦 Response:', body || '[EMPTY]');
      console.log('='.repeat(80) + '\n');
    }

    return originalSend(body);
  };

  next();
}
