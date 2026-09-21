import { Coupon } from '../entities/Coupon';

export interface ICouponRepository {
  save(coupon: Coupon): Promise<void>;
  findByCode(code: string): Promise<Coupon | null>;
  delete(code: string): Promise<void>;
  findAll(): Promise<Coupon[]>;
}
