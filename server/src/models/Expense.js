import { v4 as uuidv4 } from 'uuid';

export const SplitType = {
  EQUAL: 'EQUAL',
  EXACT: 'EXACT',
  PERCENTAGE: 'PERCENTAGE'
};

export class Expense {
  constructor(groupId, description, totalAmount, paidBy, splitType, splits) {
    this.id = uuidv4();
    this.groupId = groupId;
    this.description = description;
    this.totalAmount = totalAmount;
    this.paidBy = paidBy;
    this.splitType = splitType;
    this.splits = splits; // Array of { userId, amount?, percentage? }
    this.createdAt = new Date();
  }

  /**
   * Calculate individual amounts for each participant based on split type
   * @returns {Array} Array of { userId, amount }
   */
  calculateSplits() {
    const result = [];

    switch (this.splitType) {
      case SplitType.EQUAL:
        const amountPerPerson = this.totalAmount / this.splits.length;
        this.splits.forEach(split => {
          result.push({
            userId: split.userId,
            amount: parseFloat(amountPerPerson.toFixed(2))
          });
        });
        break;

      case SplitType.EXACT:
        this.splits.forEach(split => {
          result.push({
            userId: split.userId,
            amount: split.amount
          });
        });
        break;

      case SplitType.PERCENTAGE:
        this.splits.forEach(split => {
          const amount = (split.percentage / 100) * this.totalAmount;
          result.push({
            userId: split.userId,
            amount: parseFloat(amount.toFixed(2))
          });
        });
        break;

      default:
        throw new Error(`Unknown split type: ${this.splitType}`);
    }

    return result;
  }

  /**
   * Validate expense data
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validate() {
    const errors = [];

    if (this.totalAmount <= 0) {
      errors.push('Total amount must be positive');
    }

    if (!this.splits || this.splits.length === 0) {
      errors.push('At least one participant required');
    }

    if (this.splitType === SplitType.EXACT) {
      const sum = this.splits.reduce((acc, split) => acc + split.amount, 0);
      if (Math.abs(sum - this.totalAmount) > 0.01) { // Allow small floating point errors
        errors.push(`Sum of exact amounts (${sum}) must equal total amount (${this.totalAmount})`);
      }
    }

    if (this.splitType === SplitType.PERCENTAGE) {
      const sum = this.splits.reduce((acc, split) => acc + split.percentage, 0);
      if (Math.abs(sum - 100) > 0.01) {
        errors.push(`Sum of percentages (${sum}) must equal 100%`);
      }
    }

    // Check for negative amounts/percentages
    this.splits.forEach((split, index) => {
      if (this.splitType === SplitType.EXACT && split.amount < 0) {
        errors.push(`Split ${index}: amount cannot be negative`);
      }
      if (this.splitType === SplitType.PERCENTAGE && split.percentage < 0) {
        errors.push(`Split ${index}: percentage cannot be negative`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

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
}
