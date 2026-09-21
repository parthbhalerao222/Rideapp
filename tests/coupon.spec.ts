import { Coupon } from '../src/domain/entities/Coupon';

describe('Coupon Entity', () => {
  it('should create a coupon with percentage discount', () => {
    const expiryDate = new Date(Date.now() + 86400000); // 1 day from now
    const coupon = Coupon.create('DISCOUNT10', 'PERCENTAGE', 10, expiryDate);
    expect(coupon.code).toBe('DISCOUNT10');
    expect(coupon.discountType).toBe('PERCENTAGE');
    expect(coupon.discountValue).toBe(10);
  });

  it('should create a coupon with flat discount', () => {
    const expiryDate = new Date(Date.now() + 86400000);
    const coupon = Coupon.create('FLAT50', 'FLAT', 50, expiryDate);
    expect(coupon.code).toBe('FLAT50');
    expect(coupon.discountType).toBe('FLAT');
    expect(coupon.discountValue).toBe(50);
  });

  it('should throw error for zero discount value', () => {
    const expiryDate = new Date(Date.now() + 86400000);
    expect(() => Coupon.create('ZERO', 'FLAT', 0, expiryDate)).toThrow('Discount value must be positive');
  });

  it('should throw error for negative discount value', () => {
    const expiryDate = new Date(Date.now() + 86400000);
    expect(() => Coupon.create('NEG', 'FLAT', -10, expiryDate)).toThrow('Discount value must be positive');
  });

  it('should throw error for percentage > 100', () => {
    const expiryDate = new Date(Date.now() + 86400000);
    expect(() => Coupon.create('OVER100', 'PERCENTAGE', 150, expiryDate)).toThrow(
      'Percentage discount cannot exceed 100'
    );
  });

  it('should check if coupon is expired', () => {
    const pastDate = new Date(Date.now() - 86400000); // 1 day ago
    const coupon = Coupon.create('EXPIRED', 'FLAT', 50, pastDate);
    expect(coupon.isExpired()).toBe(true);
  });

  it('should check if coupon is not expired', () => {
    const futureDate = new Date(Date.now() + 86400000); // 1 day from now
    const coupon = Coupon.create('VALID', 'FLAT', 50, futureDate);
    expect(coupon.isExpired()).toBe(false);
  });

  it('should allow deletion of coupon', () => {
    const expiryDate = new Date(Date.now() + 86400000);
    const coupon = Coupon.create('DELETE', 'FLAT', 50, expiryDate);
    expect(coupon.isValid()).toBe(true);
    coupon.delete();
    expect(coupon.isValid()).toBe(false);
  });

  it('should return isValid as false for expired coupon', () => {
    const pastDate = new Date(Date.now() - 86400000);
    const coupon = Coupon.create('EXPIRED', 'FLAT', 50, pastDate);
    expect(coupon.isValid()).toBe(false);
  });

  it('should support maxDiscount for percentage coupons', () => {
    const expiryDate = new Date(Date.now() + 86400000);
    const coupon = Coupon.create('PERCENT_MAX', 'PERCENTAGE', 50, expiryDate, 200);
    expect(coupon.maxDiscount).toBe(200);
  });
});
