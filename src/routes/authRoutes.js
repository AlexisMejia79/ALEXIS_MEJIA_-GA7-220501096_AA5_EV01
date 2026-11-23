const express = require('express');
const createAuthController = require('../controllers/authController');

function createAuthRoutes(database, passwordHasher) {
  const router = express.Router();
  const authController = createAuthController(database, passwordHasher);

  router.post('/register', authController.register);
  router.post('/login', authController.login);

  return router;
}

module.exports = createAuthRoutes;
