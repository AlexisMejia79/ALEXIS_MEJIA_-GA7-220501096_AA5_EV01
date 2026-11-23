const express = require('express');
const database = require('./config/database');
const createAuthRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

function createApp(options = {}) {
  const app = express();
  const appDatabase = options.database || database;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', async (req, res, next) => {
    try {
      await appDatabase.query('SELECT 1');
      return res.status(200).json({
        message: 'API activa y conectada con la base de datos.'
      });
    } catch (error) {
      return next(error);
    }
  });

  app.use('/api/auth', createAuthRoutes(
    appDatabase,
    options.passwordHasher
  ));
  app.use((req, res) => {
    res.status(404).json({ message: 'La ruta solicitada no existe.' });
  });
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
