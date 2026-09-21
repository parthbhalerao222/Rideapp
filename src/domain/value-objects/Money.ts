export class Money {
  constructor(readonly amount: number) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    const result = this.amount - other.amount;
    if (result < 0) {
      return new Money(0);
    }
    return new Money(result);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amount * factor * 100) / 100);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.amount >= other.amount;
  }
}
