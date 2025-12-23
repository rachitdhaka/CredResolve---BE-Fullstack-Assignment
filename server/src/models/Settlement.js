import { v4 as uuidv4 } from 'uuid';

export class Settlement {
  constructor(groupId, fromUserId, toUserId, amount) {
    this.id = uuidv4();
    this.groupId = groupId;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.amount = amount;
    this.settledAt = new Date();
  }

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
}
