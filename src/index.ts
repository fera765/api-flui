import 'tsconfig-paths/register';
import 'dotenv/config';
import { app } from '@infra/http/app';
import { serverConfig } from '@config/server';
import { initializeSystemTools } from '@config/initialize-system-tools';

const { port } = serverConfig;

// Initialize system tools before starting server
initializeSystemTools().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to initialize system tools:', error);
  process.exit(1);
});
