import express from 'express';
import { issueToken, authRequired } from '../middleware/auth.js';

export function createAuthRoutes(userService) {
  const router = express.Router();

  router.post('/register', (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required' }
        });
      }

      const user = userService.createUser(name, email, password);
      const token = issueToken(user);
      res.status(201).json({ user: user.toJSON(), token });
    } catch (error) {
      res.status(400).json({ error: { code: 'REGISTER_ERROR', message: error.message } });
    }
  });

  router.post('/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
        });
      }

      const user = userService.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      const token = issueToken(user);
      res.json({ user: user.toJSON(), token });
    } catch (error) {
      res.status(500).json({ error: { code: 'LOGIN_ERROR', message: error.message } });
    }
  });

  router.get('/me', authRequired, (req, res) => {
    const user = userService.getUser(req.user.id);
    res.json({ user: user ? user.toJSON() : null });
  });

  return router;
}
