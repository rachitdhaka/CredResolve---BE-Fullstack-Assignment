export class Balance {
  constructor(groupId, fromUserId, toUserId, amount) {
    this.groupId = groupId;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.amount = amount;
  }

  toJSON() {
    return {
      groupId: this.groupId,
      fromUserId: this.fromUserId,
      toUserId: this.toUserId,
      amount: this.amount
    };
  }
}
