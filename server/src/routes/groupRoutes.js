import express from 'express';
import { authRequired } from '../middleware/auth.js';

export function createGroupRoutes(groupService, expenseService, balanceService) {
  const router = express.Router();
  router.use(authRequired);

  /**
   * Create a new group
   * POST /api/groups
   * Body: { name, description, createdBy }
   */
  router.post('/', (req, res) => {
    try {
      const { name, description, createdBy } = req.body;
      const ownerId = req.user?.id || createdBy;

      if (!name || !ownerId) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name and createdBy are required'
          }
        });
      }

      const group = groupService.createGroup(name, description || '', ownerId);
      res.status(201).json(group.toJSON());
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'CREATE_GROUP_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get group by ID
   * GET /api/groups/:id
   */
  router.get('/:id', (req, res) => {
    try {
      const group = groupService.getGroup(req.params.id);

      if (!group) {
        return res.status(404).json({
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }

      res.json(group.toJSON());
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_GROUP_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get all groups
   * GET /api/groups
   */
  router.get('/', (req, res) => {
    try {
      const groups = groupService.getAllGroups();
      res.json(groups.map(g => g.toJSON()));
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_GROUPS_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Add member to group
   * POST /api/groups/:id/members
   * Body: { userId }
   */
  router.post('/:id/members', (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId is required'
          }
        });
      }

      const added = groupService.addMember(req.params.id, userId);
      
      if (!added) {
        return res.status(400).json({
          error: {
            code: 'MEMBER_EXISTS',
            message: 'User is already a member'
          }
        });
      }

      const group = groupService.getGroup(req.params.id);
      res.json(group.toJSON());
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'ADD_MEMBER_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get group expenses
   * GET /api/groups/:id/expenses
   */
  router.get('/:id/expenses', (req, res) => {
    try {
      const group = groupService.getGroup(req.params.id);

      if (!group) {
        return res.status(404).json({
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }

      const expenses = expenseService.getGroupExpenses(req.params.id);
      res.json(expenses.map(e => e.toJSON()));
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_EXPENSES_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get group balances
   * GET /api/groups/:id/balances
   */
  router.get('/:id/balances', (req, res) => {
    try {
      const group = groupService.getGroup(req.params.id);

      if (!group) {
        return res.status(404).json({
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }

      const balances = balanceService.getGroupBalances(req.params.id);
      res.json(balances.map(b => b.toJSON()));
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_BALANCES_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get simplified balances for a group
   * GET /api/groups/:id/balances/simplified
   */
  router.get('/:id/balances/simplified', (req, res) => {
    try {
      const group = groupService.getGroup(req.params.id);

      if (!group) {
        return res.status(404).json({
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }

      const simplifiedBalances = balanceService.simplifyBalances(req.params.id, group.members);
      res.json({
        groupId: req.params.id,
        simplifiedTransactions: simplifiedBalances.map(b => b.toJSON()),
        transactionCount: simplifiedBalances.length
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'SIMPLIFY_BALANCES_ERROR',
          message: error.message
        }
      });
    }
  });

  return router;
}
