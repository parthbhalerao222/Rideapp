import { Coupon } from '../../domain/entities/Coupon';
import { ICouponRepository } from '../../domain/interfaces/ICouponRepository';

export class InMemoryCouponRepository implements ICouponRepository {
  private coupons: Map<string, Coupon> = new Map();

  async save(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.code, coupon);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.coupons.get(code) || null;
  }

  async delete(code: string): Promise<void> {
    const coupon = this.coupons.get(code);
    if (coupon) {
      coupon.delete();
    }
  }

  async findAll(): Promise<Coupon[]> {
    return Array.from(this.coupons.values());
  }
}
