import 'tsconfig-paths/register';
import 'dotenv/config';
import { app } from '@infra/http/app';
import { serverConfig } from '@config/server';

const { port } = serverConfig;

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
