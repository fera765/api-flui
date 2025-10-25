import express, { Express } from 'express';
import { routes } from '@http/routes';
import { errorHandler } from '@http/middlewares';

const app: Express = express();

app.use(express.json());
app.use(routes);
app.use(errorHandler);

export { app };
