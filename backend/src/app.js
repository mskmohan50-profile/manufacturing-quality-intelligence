import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { recordsRouter } from './routes/records.js';
import { auditLogsRouter } from './routes/auditLogs.js';

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: '5mb' })); 

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);
  app.use('/api/records', recordsRouter);
  app.use('/api/audit-logs', auditLogsRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  });

  return app;
}
