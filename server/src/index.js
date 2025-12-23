import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, saveDb } from './db.js';
import { createDbWrapper } from './dbWrapper.js';
import { UserService } from './services/UserService.js';
import { GroupService } from './services/GroupService.js';
import { BalanceService } from './services/BalanceService.js';
import { ExpenseService } from './services/ExpenseService.js';
import { SettlementService } from './services/SettlementService.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createGroupRoutes } from './routes/groupRoutes.js';
import { createExpenseRoutes } from './routes/expenseRoutes.js';
import { createSettlementRoutes } from './routes/settlementRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check and root endpoints (don't need service initialization)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Expense Sharing Application API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user'
      },
      users: {
        'POST /api/users': 'Create a new user',
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'GET /api/users/:id/balances': 'Get user balances'
      },
      groups: {
        'POST /api/groups': 'Create a new group',
        'GET /api/groups': 'Get all groups',
        'GET /api/groups/:id': 'Get group by ID',
        'POST /api/groups/:id/members': 'Add member to group',
        'GET /api/groups/:id/expenses': 'Get group expenses',
        'GET /api/groups/:id/balances': 'Get group balances',
        'GET /api/groups/:id/balances/simplified': 'Get simplified balances'
      },
      expenses: {
        'POST /api/expenses': 'Add a new expense',
        'GET /api/expenses/:id': 'Get expense by ID',
        'DELETE /api/expenses/:id': 'Delete expense'
      },
      settlements: {
        'POST /api/settlements': 'Record a settlement',
        'GET /api/settlements/:id': 'Get settlement by ID',
        'GET /api/settlements/groups/:groupId': 'Get group settlements'
      }
    }
  });
});

// Initialize and start server
const start = async () => {
  try {
    const rawDb = await initDb();
    const db = createDbWrapper(rawDb, saveDb);

    const userService = new UserService(db);
    const balanceService = new BalanceService(db);
    const groupService = new GroupService(db, userService);
    const expenseService = new ExpenseService(db, groupService, userService, balanceService);
    const settlementService = new SettlementService(db, groupService, userService, balanceService);

    // Register API routes
    app.use('/api/auth', createAuthRoutes(userService));
    app.use('/api/users', createUserRoutes(userService, balanceService));
    app.use('/api/groups', createGroupRoutes(groupService, expenseService, balanceService));
    app.use('/api/expenses', createExpenseRoutes(expenseService));
    app.use('/api/settlements', createSettlementRoutes(settlementService));

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        }
      });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Expense Sharing API server running on port ${PORT}`);
      console.log(`📍 API Documentation: http://localhost:${PORT}/`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

export default app;
