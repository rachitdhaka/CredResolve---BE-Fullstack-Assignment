import express from 'express';
import { authRequired } from '../middleware/auth.js';

export function createUserRoutes(userService, balanceService) {
  const router = express.Router();

  /**
   * Create a new user
   * POST /api/users
   * Body: { name, email }
   */
  router.post('/', (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, email and password are required'
          }
        });
      }

      const user = userService.createUser(name, email, password);
      res.status(201).json(user.toJSON());
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'CREATE_USER_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  router.get('/:id', authRequired, (req, res) => {
    try {
      const user = userService.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json(user.toJSON());
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_USER_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get all users
   * GET /api/users
   */
  router.get('/', authRequired, (req, res) => {
    try {
      const users = userService.getAllUsers();
      res.json(users.map(u => u.toJSON()));
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_USERS_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get user's balances across all groups
   * GET /api/users/:id/balances
   */
  router.get('/:id/balances', authRequired, (req, res) => {
    try {
      const user = userService.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      const balances = balanceService.getUserBalances(req.params.id);
      res.json({
        userId: req.params.id,
        owes: balances.owes.map(b => b.toJSON()),
        owed: balances.owed.map(b => b.toJSON()),
        netBalance: balances.netBalance
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_BALANCES_ERROR',
          message: error.message
        }
      });
    }
  });

  return router;
}
