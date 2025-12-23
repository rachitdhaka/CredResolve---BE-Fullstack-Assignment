import { v4 as uuidv4 } from 'uuid';

const mapRowToSettlement = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    groupId: row.group_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    amount: row.amount,
    settledAt: row.settled_at,
    toJSON() {
      return {
        id: this.id,
        groupId: this.groupId,
        fromUserId: this.fromUserId,
        toUserId: this.toUserId,
        amount: this.amount,
        settledAt: this.settledAt
      };
    }
  };
};

/**
 * Service for managing settlements with SQLite persistence
 */
export class SettlementService {
  constructor(db, groupService, userService, balanceService) {
    this.db = db;
    this.groupService = groupService;
    this.userService = userService;
    this.balanceService = balanceService;

    this.insertStmt = db.prepare(
      'INSERT INTO settlements (id, group_id, from_user_id, to_user_id, amount) VALUES (?, ?, ?, ?, ?)'
    );
    this.getStmt = db.prepare('SELECT * FROM settlements WHERE id = ?');
    this.getGroupStmt = db.prepare('SELECT * FROM settlements WHERE group_id = ? ORDER BY settled_at DESC');
    this.getUserStmt = db.prepare(
      'SELECT * FROM settlements WHERE from_user_id = ? OR to_user_id = ? ORDER BY settled_at DESC'
    );
  }

  recordSettlement({ groupId, fromUserId, toUserId, amount }) {
    const group = this.groupService.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    if (!group.members.includes(fromUserId) || !group.members.includes(toUserId)) {
      throw new Error('Both users must be group members');
    }

    if (amount <= 0) {
      throw new Error('Settlement amount must be positive');
    }

    const currentBalance = this.balanceService.getBalanceBetweenUsers(groupId, fromUserId, toUserId);
    if (currentBalance === 0) {
      throw new Error('No balance exists between these users');
    }

    if (amount > currentBalance + 0.01) {
      throw new Error(`Settlement amount (${amount}) exceeds current balance (${currentBalance})`);
    }

    const settlementId = uuidv4();

    this.insertStmt.run(settlementId, groupId, fromUserId, toUserId, amount);
    this.balanceService.settleBalance(groupId, fromUserId, toUserId, amount);

    const settlement = this.getSettlement(settlementId);
    const remainingBalance = this.balanceService.getBalanceBetweenUsers(groupId, fromUserId, toUserId);
    return {
      settlement,
      remainingBalance: parseFloat(remainingBalance.toFixed(2))
    };
  }

  getSettlement(settlementId) {
    return mapRowToSettlement(this.getStmt.get(settlementId));
  }

  getGroupSettlements(groupId) {
    return this.getGroupStmt.all(groupId).map(mapRowToSettlement).filter(Boolean);
  }

  getUserSettlements(userId) {
    return this.getUserStmt.all(userId, userId).map(mapRowToSettlement).filter(Boolean);
  }
}
