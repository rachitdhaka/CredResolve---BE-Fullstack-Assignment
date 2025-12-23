import { v4 as uuidv4 } from 'uuid';

const SplitType = {
  EQUAL: 'EQUAL',
  EXACT: 'EXACT',
  PERCENTAGE: 'PERCENTAGE'
};

const mapRowToExpense = (row, splits) => {
  if (!row) return null;
  return {
    id: row.id,
    groupId: row.group_id,
    description: row.description,
    totalAmount: row.total_amount,
    paidBy: row.paid_by,
    splitType: row.split_type,
    splits,
    createdAt: row.created_at,
    toJSON() {
      return {
        id: this.id,
        groupId: this.groupId,
        description: this.description,
        totalAmount: this.totalAmount,
        paidBy: this.paidBy,
        splitType: this.splitType,
        splits: this.splits,
        createdAt: this.createdAt
      };
    }
  };
};

const validateExpense = ({ totalAmount, splitType, splits }) => {
  const errors = [];
  if (totalAmount <= 0) errors.push('Total amount must be positive');
  if (!splits || splits.length === 0) errors.push('At least one participant required');

  if (splitType === SplitType.EXACT) {
    const sum = splits.reduce((acc, split) => acc + (split.amount ?? 0), 0);
    if (Math.abs(sum - totalAmount) > 0.01) {
      errors.push(`Sum of exact amounts (${sum}) must equal total amount (${totalAmount})`);
    }
  }

  if (splitType === SplitType.PERCENTAGE) {
    const sum = splits.reduce((acc, split) => acc + (split.percentage ?? 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      errors.push(`Sum of percentages (${sum}) must equal 100%`);
    }
  }

  splits.forEach((split, index) => {
    if (splitType === SplitType.EXACT && split.amount < 0) {
      errors.push(`Split ${index}: amount cannot be negative`);
    }
    if (splitType === SplitType.PERCENTAGE && split.percentage < 0) {
      errors.push(`Split ${index}: percentage cannot be negative`);
    }
  });

  return { valid: errors.length === 0, errors };
};

const calculateSplits = ({ totalAmount, splitType, splits }) => {
  switch (splitType) {
    case SplitType.EQUAL: {
      const amountPerPerson = totalAmount / splits.length;
      return splits.map((split) => ({
        userId: split.userId,
        amount: parseFloat(amountPerPerson.toFixed(2))
      }));
    }
    case SplitType.EXACT:
      return splits.map((split) => ({ userId: split.userId, amount: split.amount }));
    case SplitType.PERCENTAGE:
      return splits.map((split) => ({
        userId: split.userId,
        amount: parseFloat(((split.percentage / 100) * totalAmount).toFixed(2))
      }));
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
};

/**
 * Service for managing expenses with SQLite persistence
 */
export class ExpenseService {
  constructor(db, groupService, userService, balanceService) {
    this.db = db;
    this.groupService = groupService;
    this.userService = userService;
    this.balanceService = balanceService;

    this.insertExpenseStmt = db.prepare(
      'INSERT INTO expenses (id, group_id, description, total_amount, paid_by, split_type) VALUES (?, ?, ?, ?, ?, ?)'
    );
    this.insertSplitStmt = db.prepare(
      'INSERT INTO expense_splits (expense_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)'
    );
    this.getExpenseStmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
    this.getSplitsStmt = db.prepare('SELECT user_id, amount, percentage FROM expense_splits WHERE expense_id = ?');
    this.getGroupExpensesStmt = db.prepare('SELECT * FROM expenses WHERE group_id = ? ORDER BY created_at DESC');
    this.getUserExpensesStmt = db.prepare(
      'SELECT DISTINCT e.* FROM expenses e LEFT JOIN expense_splits s ON e.id = s.expense_id WHERE e.paid_by = ? OR s.user_id = ? ORDER BY e.created_at DESC'
    );
    this.deleteExpenseStmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    this.getGroupSettlementsStmt = db.prepare('SELECT * FROM settlements WHERE group_id = ?');
  }

  addExpense(expenseData) {
    const { groupId, description, totalAmount, paidBy, splitType, splits } = expenseData;

    const group = this.groupService.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    if (!group.members.includes(paidBy)) {
      throw new Error('Payer must be a group member');
    }

    const participantIds = splits.map((s) => s.userId);
    const memberValidation = this.groupService.validateGroupMembers(groupId, participantIds);
    if (!memberValidation.valid) {
      throw new Error(`Users not in group: ${memberValidation.nonMembers.join(', ')}`);
    }

    const validation = validateExpense({ totalAmount, splitType, splits });
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const calculatedSplits = calculateSplits({ totalAmount, splitType, splits });
    const expenseId = uuidv4();

    this.insertExpenseStmt.run(
      expenseId,
      groupId,
      description,
      totalAmount,
      paidBy,
      splitType
    );

    calculatedSplits.forEach((split) => {
      this.insertSplitStmt.run(
        expenseId,
        split.userId,
        split.amount,
        splitType === SplitType.PERCENTAGE ? splits.find((s) => s.userId === split.userId)?.percentage ?? null : null
      );

      if (split.userId !== paidBy) {
        this.balanceService.updateBalance(groupId, split.userId, paidBy, split.amount);
      }
    });

    const expense = this.getExpense(expenseId);
    const balances = this.balanceService.getGroupBalances(groupId);
    return { expense, balances };
  }

  getExpense(expenseId) {
    const row = this.getExpenseStmt.get(expenseId);
    if (!row) return null;
    const splits = this.getSplitsStmt.all(expenseId).map((s) => ({
      userId: s.user_id,
      amount: s.amount,
      percentage: s.percentage
    }));
    return mapRowToExpense(row, splits);
  }

  getGroupExpenses(groupId) {
    return this.getGroupExpensesStmt.all(groupId).map((row) => {
      const splits = this.getSplitsStmt.all(row.id).map((s) => ({
        userId: s.user_id,
        amount: s.amount,
        percentage: s.percentage
      }));
      return mapRowToExpense(row, splits);
    });
  }

  getUserExpenses(userId) {
    return this.getUserExpensesStmt.all(userId, userId).map((row) => {
      const splits = this.getSplitsStmt.all(row.id).map((s) => ({
        userId: s.user_id,
        amount: s.amount,
        percentage: s.percentage
      }));
      return mapRowToExpense(row, splits);
    });
  }

  deleteExpense(expenseId) {
    const expense = this.getExpense(expenseId);
    if (!expense) return false;

    this.deleteExpenseStmt.run(expenseId);
    this.recalculateGroupBalances(expense.groupId);
    return true;
  }

  recalculateGroupBalances(groupId) {
    const group = this.groupService.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    // Clear existing balances for this group
    this.balanceService.clearGroupBalances(groupId);

    const expenses = this.getGroupExpenses(groupId);
    expenses.forEach((expense) => {
      const calculatedSplits = calculateSplits({
        totalAmount: expense.totalAmount,
        splitType: expense.splitType,
        splits: expense.splits
      });

      calculatedSplits.forEach((split) => {
        if (split.userId !== expense.paidBy) {
          this.balanceService.updateBalance(groupId, split.userId, expense.paidBy, split.amount);
        }
      });
    });

    // Re-apply settlements to adjust balances
    const settlements = this.getGroupSettlementsStmt.all(groupId);
    settlements.forEach((settlement) => {
      const current = this.balanceService.getBalanceBetweenUsers(
        settlement.group_id,
        settlement.from_user_id,
        settlement.to_user_id
      );
      if (current > 0) {
        this.balanceService.settleBalance(
          settlement.group_id,
          settlement.from_user_id,
          settlement.to_user_id,
          Math.min(settlement.amount, current)
        );
      }
    });
  }
}
