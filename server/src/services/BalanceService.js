const mapRowToBalance = (row) => {
  if (!row) return null;
  return {
    groupId: row.group_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    amount: parseFloat(row.amount.toFixed(2)),
    toJSON() {
      return {
        groupId: this.groupId,
        fromUserId: this.fromUserId,
        toUserId: this.toUserId,
        amount: this.amount
      };
    }
  };
};

/**
 * Service for managing and calculating balances persisted in SQLite
 */
export class BalanceService {
  constructor(db) {
    this.db = db;
    this.getBalanceStmt = db.prepare(
      'SELECT amount FROM balances WHERE group_id = ? AND from_user_id = ? AND to_user_id = ?'
    );
    // Remove ON CONFLICT clause for sql.js compatibility - we'll handle upsert manually
    this.deleteBalanceStmt = db.prepare(
      'DELETE FROM balances WHERE group_id = ? AND from_user_id = ? AND to_user_id = ?'
    );
    this.insertBalanceStmt = db.prepare(
      'INSERT INTO balances (group_id, from_user_id, to_user_id, amount) VALUES (?, ?, ?, ?)'
    );
    this.getGroupBalancesStmt = db.prepare('SELECT * FROM balances WHERE group_id = ?');
    this.clearGroupStmt = db.prepare('DELETE FROM balances WHERE group_id = ?');
  }

  // Helper method to set balance (upsert pattern)
  setBalance(groupId, fromUserId, toUserId, amount) {
    this.deleteBalanceStmt.run(groupId, fromUserId, toUserId);
    if (amount > 0) {
      this.insertBalanceStmt.run(groupId, fromUserId, toUserId, amount);
    }
  }

  getBalanceBetweenUsers(groupId, fromUserId, toUserId) {
    const row = this.getBalanceStmt.get(groupId, fromUserId, toUserId);
    return row ? row.amount : 0;
  }

  updateBalance(groupId, fromUserId, toUserId, amount) {
    const reverse = this.getBalanceBetweenUsers(groupId, toUserId, fromUserId);

    if (reverse > 0) {
      if (reverse > amount) {
        const newAmount = reverse - amount;
        this.setBalance(groupId, toUserId, fromUserId, newAmount);
      } else if (reverse < amount) {
        this.setBalance(groupId, toUserId, fromUserId, 0); // Delete
        const newAmount = amount - reverse;
        this.setBalance(groupId, fromUserId, toUserId, newAmount);
      } else {
        this.setBalance(groupId, toUserId, fromUserId, 0); // Delete
      }
    } else {
      const current = this.getBalanceBetweenUsers(groupId, fromUserId, toUserId);
      const newAmount = current + amount;
      this.setBalance(groupId, fromUserId, toUserId, newAmount);
    }
  }

  getGroupBalances(groupId) {
    return this.getGroupBalancesStmt
      .all(groupId)
      .filter((row) => row.amount > 0)
      .map(mapRowToBalance);
  }

  getUserBalancesInGroup(groupId, userId) {
    const all = this.getGroupBalances(groupId);
    const owes = all.filter((b) => b.fromUserId === userId);
    const owed = all.filter((b) => b.toUserId === userId);
    return { owes, owed };
  }

  getUserBalances(userId) {
    const rows = this.db
      .prepare('SELECT * FROM balances WHERE from_user_id = ? OR to_user_id = ?')
      .all(userId, userId)
      .map(mapRowToBalance)
      .filter(Boolean);

    const owes = rows.filter((b) => b.fromUserId === userId);
    const owed = rows.filter((b) => b.toUserId === userId);

    const totalOwes = owes.reduce((sum, b) => sum + b.amount, 0);
    const totalOwed = owed.reduce((sum, b) => sum + b.amount, 0);
    const netBalance = parseFloat((totalOwed - totalOwes).toFixed(2));

    return { owes, owed, netBalance };
  }

  simplifyBalances(groupId, userIds) {
    const netBalances = new Map();
    userIds.forEach((userId) => netBalances.set(userId, 0));

    const balances = this.getGroupBalances(groupId);
    balances.forEach((balance) => {
      netBalances.set(balance.fromUserId, (netBalances.get(balance.fromUserId) || 0) - balance.amount);
      netBalances.set(balance.toUserId, (netBalances.get(balance.toUserId) || 0) + balance.amount);
    });

    const debtors = [];
    const creditors = [];

    for (const [userId, amt] of netBalances.entries()) {
      if (amt < -0.01) debtors.push({ userId, amount: Math.abs(amt) });
      else if (amt > 0.01) creditors.push({ userId, amount: amt });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplified = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      simplified.push({
        groupId,
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: parseFloat(settleAmount.toFixed(2)),
        toJSON() {
          return {
            groupId: this.groupId,
            fromUserId: this.fromUserId,
            toUserId: this.toUserId,
            amount: this.amount
          };
        }
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return simplified;
  }

  settleBalance(groupId, fromUserId, toUserId, amount) {
    const current = this.getBalanceBetweenUsers(groupId, fromUserId, toUserId);
    if (!current) {
      throw new Error('No balance exists between these users');
    }

    if (amount > current + 0.01) {
      throw new Error(`Settlement amount (${amount}) exceeds current balance (${current})`);
    }

    const newBalance = current - amount;
    this.setBalance(groupId, fromUserId, toUserId, newBalance);
    return true;
  }

  clearGroupBalances(groupId) {
    this.clearGroupStmt.run(groupId);
  }

  clearAllBalances() {
    this.db.exec('DELETE FROM balances');
  }
}
