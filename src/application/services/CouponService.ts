import { Coupon } from '../../domain/entities/Coupon';
import { Money } from '../../domain/value-objects/Money';
import { ICouponRepository } from '../../domain/interfaces/ICouponRepository';
import { CouponNotFoundError, InvalidCouponError, CouponExpiredError } from '../../shared/errors';

export class CouponService {
  constructor(private couponRepository: ICouponRepository) {}

  async createCoupon(
    code: string,
    discountType: 'PERCENTAGE' | 'FLAT',
    discountValue: number,
    expiryDate: Date,
    maxDiscount?: number
  ): Promise<Coupon> {
    const coupon = Coupon.create(code, discountType, discountValue, expiryDate, maxDiscount);
    await this.couponRepository.save(coupon);
    return coupon;
  }

  async validateAndGetCoupon(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new CouponNotFoundError(`Coupon ${code} not found`);
    }
    if (coupon.isExpired()) {
      throw new CouponExpiredError(`Coupon ${code} has expired`);
    }
    if (!coupon.isValid()) {
      throw new InvalidCouponError(`Coupon ${code} is not valid`);
    }
    return coupon;
  }

  async applyCoupon(code: string, fare: Money): Promise<Money> {
    const coupon = await this.validateAndGetCoupon(code);

    let discount: Money;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = fare.multiply(coupon.discountValue / 100);
      if (coupon.maxDiscount) {
        const maxDiscountMoney = new Money(coupon.maxDiscount);
        if (discount.isGreaterThanOrEqual(maxDiscountMoney)) {
          discount = maxDiscountMoney;
        }
      }
    } else {
      discount = new Money(coupon.discountValue);
    }

    return fare.subtract(discount);
  }

  async deleteCoupon(code: string): Promise<void> {
    await this.couponRepository.delete(code);
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    return this.couponRepository.findByCode(code);
  }
}
