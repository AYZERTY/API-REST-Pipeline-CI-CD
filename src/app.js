import express from 'express';
import { createStore } from './data.js';
import { createStudentRouter } from './routes.js';

export function createApp(store = createStore()) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/students', createStudentRouter(store));
  app.use((_req, res) => res.status(404).json({ error: 'Route introuvable.' }));
  // Quatre arguments sont nécessaires pour qu'Express reconnaisse ce middleware.
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Corps de requête trop volumineux.' });
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  });
  return app;
}
