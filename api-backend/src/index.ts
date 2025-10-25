import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { serverConfig } from '@/config/server';
import { createRoutes } from '@/http/routes';
import { HealthController } from '@/modules/core/controllers/HealthController';
import { HealthService } from '@/modules/core/services/HealthService';
import { InMemoryHealthRepository } from '@/modules/core/repositories/InMemoryHealthRepository';

// Initialize dependencies
const healthRepository = new InMemoryHealthRepository();
const healthService = new HealthService(healthRepository);
const healthController = new HealthController(healthService);

// Create Express app
const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use(createRoutes(healthController));

// Start server
const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${serverConfig.environment}`);
  console.log(`🏷️  API: ${serverConfig.name} v${serverConfig.version}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
});

export { app };