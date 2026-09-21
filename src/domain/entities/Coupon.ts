export class Coupon {
  private isDeleted = false;

  constructor(
    readonly code: string,
    readonly discountType: 'PERCENTAGE' | 'FLAT',
    readonly discountValue: number,
    readonly expiryDate: Date,
    readonly maxDiscount?: number
  ) {
    if (discountValue <= 0) {
      throw new Error('Discount value must be positive');
    }
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100');
    }
  }

  static create(
    code: string,
    discountType: 'PERCENTAGE' | 'FLAT',
    discountValue: number,
    expiryDate: Date,
    maxDiscount?: number
  ): Coupon {
    return new Coupon(code, discountType, discountValue, expiryDate, maxDiscount);
  }

  isExpired(): boolean {
    return new Date() > this.expiryDate;
  }

  delete(): void {
    this.isDeleted = true;
  }

  isValid(): boolean {
    return !this.isDeleted && !this.isExpired();
  }
}
