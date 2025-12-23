import express from 'express';
import { authRequired } from '../middleware/auth.js';

export function createSettlementRoutes(settlementService) {
  const router = express.Router();
  router.use(authRequired);

  /**
   * Record a settlement
   * POST /api/settlements
   * Body: { groupId, fromUserId, toUserId, amount }
   */
  router.post('/', (req, res) => {
    try {
      const { groupId, fromUserId, toUserId, amount } = req.body;
      const payerId = fromUserId || req.user?.id;

      // Validate required fields
      if (!groupId || !payerId || !toUserId || !amount) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All fields are required: groupId, fromUserId, toUserId, amount'
          }
        });
      }

      const result = settlementService.recordSettlement({
        groupId,
        fromUserId: payerId,
        toUserId,
        amount
      });

      res.status(201).json({
        settlement: result.settlement.toJSON(),
        remainingBalance: result.remainingBalance
      });
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'RECORD_SETTLEMENT_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get settlement by ID
   * GET /api/settlements/:id
   */
  router.get('/:id', (req, res) => {
    try {
      const settlement = settlementService.getSettlement(req.params.id);
      
      if (!settlement) {
        return res.status(404).json({
          error: {
            code: 'SETTLEMENT_NOT_FOUND',
            message: 'Settlement not found'
          }
        });
      }

      res.json(settlement.toJSON());
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_SETTLEMENT_ERROR',
          message: error.message
        }
      });
    }
  });

  /**
   * Get group settlements
   * GET /api/groups/:groupId/settlements
   */
  router.get('/groups/:groupId', (req, res) => {
    try {
      const settlements = settlementService.getGroupSettlements(req.params.groupId);
      res.json(settlements.map(s => s.toJSON()));
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'GET_SETTLEMENTS_ERROR',
          message: error.message
        }
      });
    }
  });

  return router;
}
