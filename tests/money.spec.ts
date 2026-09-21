import { Money } from '../src/domain/value-objects/Money';

describe('Money Value Object', () => {
  it('should create money with amount', () => {
    const money = new Money(100);
    expect(money.amount).toBe(100);
  });

  it('should throw error for negative amount', () => {
    expect(() => new Money(-10)).toThrow('Money amount cannot be negative');
  });

  it('should add two money objects', () => {
    const money1 = new Money(100);
    const money2 = new Money(50);
    const result = money1.add(money2);
    expect(result.amount).toBe(150);
  });

  it('should subtract two money objects', () => {
    const money1 = new Money(100);
    const money2 = new Money(30);
    const result = money1.subtract(money2);
    expect(result.amount).toBe(70);
  });

  it('should return 0 if subtraction goes negative', () => {
    const money1 = new Money(100);
    const money2 = new Money(150);
    const result = money1.subtract(money2);
    expect(result.amount).toBe(0);
  });

  it('should multiply money by factor', () => {
    const money = new Money(100);
    const result = money.multiply(1.5);
    expect(result.amount).toBe(150);
  });

  it('should multiply money by percentage', () => {
    const money = new Money(100);
    const result = money.multiply(0.5);
    expect(result.amount).toBe(50);
  });

  it('should round multiplied result to 2 decimal places', () => {
    const money = new Money(100);
    const result = money.multiply(0.33);
    expect(result.amount).toBe(33);
  });

  it('should compare money objects for equality', () => {
    const money1 = new Money(100);
    const money2 = new Money(100);
    const money3 = new Money(50);
    expect(money1.equals(money2)).toBe(true);
    expect(money1.equals(money3)).toBe(false);
  });

  it('should check if money is greater than or equal', () => {
    const money1 = new Money(100);
    const money2 = new Money(50);
    const money3 = new Money(100);
    expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
    expect(money1.isGreaterThanOrEqual(money3)).toBe(true);
    expect(money2.isGreaterThanOrEqual(money1)).toBe(false);
  });
});
