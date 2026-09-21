import { CouponService } from '../src/application/services/CouponService';
import { InMemoryCouponRepository } from '../src/infrastructure/repositories/InMemoryCouponRepository';
import { Money } from '../src/domain/value-objects/Money';
import { CouponNotFoundError, CouponExpiredError, InvalidCouponError } from '../src/shared/errors';

describe('CouponService', () => {
  let couponService: CouponService;
  let couponRepository: InMemoryCouponRepository;

  beforeEach(() => {
    couponRepository = new InMemoryCouponRepository();
    couponService = new CouponService(couponRepository);
  });

  it('should create a coupon', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    const coupon = await couponService.createCoupon('SUMMER20', 'PERCENTAGE', 20, expiryDate);
    expect(coupon.code).toBe('SUMMER20');
    expect(coupon.discountValue).toBe(20);
  });

  it('should validate and get a valid coupon', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    await couponService.createCoupon('VALID10', 'FLAT', 10, expiryDate);
    const coupon = await couponService.validateAndGetCoupon('VALID10');
    expect(coupon.code).toBe('VALID10');
  });

  it('should throw CouponNotFoundError for non-existent coupon', async () => {
    await expect(couponService.validateAndGetCoupon('NOTFOUND')).rejects.toThrow(CouponNotFoundError);
  });

  it('should throw CouponExpiredError for expired coupon', async () => {
    const pastDate = new Date(Date.now() - 86400000);
    await couponService.createCoupon('EXPIRED', 'FLAT', 50, pastDate);
    await expect(couponService.validateAndGetCoupon('EXPIRED')).rejects.toThrow(CouponExpiredError);
  });

  it('should throw InvalidCouponError for deleted coupon', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    await couponService.createCoupon('DELETED', 'FLAT', 50, expiryDate);
    await couponService.deleteCoupon('DELETED');
    await expect(couponService.validateAndGetCoupon('DELETED')).rejects.toThrow(InvalidCouponError);
  });

  it('should apply flat discount', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    await couponService.createCoupon('FLAT30', 'FLAT', 30, expiryDate);
    const originalFare = new Money(100);
    const discountedFare = await couponService.applyCoupon('FLAT30', originalFare);
    expect(discountedFare.amount).toBe(70);
  });

  it('should apply percentage discount', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    await couponService.createCoupon('PERCENT50', 'PERCENTAGE', 50, expiryDate);
    const originalFare = new Money(200);
    const discountedFare = await couponService.applyCoupon('PERCENT50', originalFare);
    expect(discountedFare.amount).toBe(100);
  });

  it('should respect maxDiscount for percentage coupon', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    await couponService.createCoupon('PERCENT_MAX', 'PERCENTAGE', 50, expiryDate, 100);
    const originalFare = new Money(500);
    const discountedFare = await couponService.applyCoupon('PERCENT_MAX', originalFare);
    // 50% of 500 = 250, but maxDiscount is 100, so 500 - 100 = 400
    expect(discountedFare.amount).toBe(400);
  });

  it('should not allow fare to go negative', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    await couponService.createCoupon('HUGE', 'FLAT', 1000, expiryDate);
    const originalFare = new Money(100);
    const discountedFare = await couponService.applyCoupon('HUGE', originalFare);
    expect(discountedFare.amount).toBe(0);
  });

  it('should delete a coupon', async () => {
    const expiryDate = new Date(Date.now() + 86400000);
    await couponService.createCoupon('TODELETE', 'FLAT', 50, expiryDate);
    await couponService.deleteCoupon('TODELETE');
    const coupon = await couponService.getCouponByCode('TODELETE');
    expect(coupon?.isValid()).toBe(false);
  });
});
