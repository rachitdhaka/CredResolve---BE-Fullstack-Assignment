import express from 'express';
import { authRequired } from '../middleware/auth.js';

export function createExpenseRoutes(expenseService) {
  const router = express.Router();
  router.use(authRequired);

  /**
   * Add a new expense
   * POST /api/expenses
   * Body: { groupId, description, totalAmount, paidBy, splitType, splits }
   */
  router.post('/', (req, res) => {
    try {
      const { groupId, description, totalAmount, paidBy, splitType, splits } = req.body;
      const payerId = paidBy || req.user?.id;

      // Validate required fields
      if (!groupId || !description || !totalAmount || !payerId || !splitType || !splits) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All fields are required: groupId, description, totalAmount, paidBy, splitType, splits'
          }
        });
      }

      const result = expenseService.addExpense({
        groupId,
        description,
        totalAmount,
        paidBy: payerId,
        splitType,
        splits
      });

      res.status(201).json({
        expense: result.expense.toJSON(),
        updatedBalances: result.balances.map(b => b.toJSON())
      });
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'ADD_EXPENSE_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get expense by ID
   * GET /api/expenses/:id
   */
  router.get('/:id', (req, res) => {
    try {
      const expense = expenseService.getExpense(req.params.id);
      
      if (!expense) {
        return res.status(404).json({
          error: {
            code: 'EXPENSE_NOT_FOUND',
            message: 'Expense not found'
          }
        });
      }

      res.json(expense.toJSON());
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_EXPENSE_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Delete an expense
   * DELETE /api/expenses/:id
   */
  router.delete('/:id', (req, res) => {
    try {
      const success = expenseService.deleteExpense(req.params.id);
      
      if (!success) {
        return res.status(404).json({
          error: {
            code: 'EXPENSE_NOT_FOUND',
            message: 'Expense not found'
          }
        });
      }

      res.json({
        message: 'Expense deleted and balances recalculated',
        success: true
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'DELETE_EXPENSE_ERROR',
          message: error.message
        }
      });
    }
  });

  return router;
}
