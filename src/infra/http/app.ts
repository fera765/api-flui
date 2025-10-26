import express, { Express } from 'express';
import cors from 'cors';
import { routes } from '@http/routes';
import { errorHandler } from '@http/middlewares';

const app: Express = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:8080',  // Frontend dev server
    'http://localhost:3000',  // Alternative port
    'http://localhost:5173',  // Vite default port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(routes);
app.use(errorHandler);

export { app };
