import { Request, Response } from 'express';
import { CouponService } from '../../application/services/CouponService';
import { CouponResponse } from '../../application/dtos';

export class CouponController {
  constructor(private couponService: CouponService) {}

  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { code, discountType, discountValue, expiryDate, maxDiscount } = req.body;
      if (!code || !discountType || !discountValue || !expiryDate) {
        res.status(400).json({ error: 'code, discountType, discountValue, and expiryDate are required' });
        return;
      }
      const coupon = await this.couponService.createCoupon(
        code,
        discountType as 'PERCENTAGE' | 'FLAT',
        discountValue,
        new Date(expiryDate),
        maxDiscount
      );
      res.status(201).json(this.couponToResponse(coupon));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const code = req.params.code as string;
      await this.couponService.deleteCoupon(code);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getCoupon(req: Request, res: Response): Promise<void> {
    try {
      const code = req.params.code as string;
      const coupon = await this.couponService.getCouponByCode(code);
      if (!coupon) {
        res.status(404).json({ error: 'Coupon not found' });
        return;
      }
      res.status(200).json(this.couponToResponse(coupon));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private couponToResponse(coupon: any): CouponResponse {
    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiryDate: coupon.expiryDate.toISOString(),
      maxDiscount: coupon.maxDiscount,
      isValid: coupon.isValid(),
    };
  }
}
