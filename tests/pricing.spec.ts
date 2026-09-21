import { HatchbackPricingStrategy, SedanPricingStrategy } from '../src/application/strategies/PricingStrategy';
import { Money } from '../src/domain/value-objects/Money';
import { PRICING_CONFIG } from '../src/shared/constants/pricing';

describe('Pricing Strategies', () => {
  describe('HatchbackPricingStrategy', () => {
    const strategy = new HatchbackPricingStrategy();

    it('should apply minimum fare for 0km', () => {
      const fare = strategy.calculateFare(0);
      expect(fare.amount).toBe(PRICING_CONFIG.MINIMUM_FARE);
    });

    it('should calculate correctly for 1km (tier 1)', () => {
      const fare = strategy.calculateFare(1);
      const expected = Math.max(1 * 10, PRICING_CONFIG.MINIMUM_FARE);
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for exactly 2km (tier 1 boundary)', () => {
      const fare = strategy.calculateFare(2);
      const expected = Math.max(2 * 10, PRICING_CONFIG.MINIMUM_FARE); // 20, but min is 50
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for 3km (tier 2)', () => {
      const fare = strategy.calculateFare(3);
      const expected = Math.max(2 * 10 + 1 * 8, PRICING_CONFIG.MINIMUM_FARE); // 28, but min is 50
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for exactly 5km (tier 2 boundary)', () => {
      const fare = strategy.calculateFare(5);
      const expected = Math.max(2 * 10 + 3 * 8, PRICING_CONFIG.MINIMUM_FARE); // 44, but min is 50
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for 6km (tier 3)', () => {
      const fare = strategy.calculateFare(6);
      const expected = Math.max(2 * 10 + 3 * 8 + 1 * 5, PRICING_CONFIG.MINIMUM_FARE); // 49, but min is 50
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for 10km', () => {
      const fare = strategy.calculateFare(10);
      const expected = 2 * 10 + 3 * 8 + 5 * 5;
      expect(fare.amount).toBe(expected);
    });
  });

  describe('SedanPricingStrategy', () => {
    const strategy = new SedanPricingStrategy();

    it('should apply minimum fare for 0km', () => {
      const fare = strategy.calculateFare(0);
      expect(fare.amount).toBe(PRICING_CONFIG.MINIMUM_FARE);
    });

    it('should calculate correctly for 1km (tier 1)', () => {
      const fare = strategy.calculateFare(1);
      const expected = Math.max(1 * 15, PRICING_CONFIG.MINIMUM_FARE);
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for 2km', () => {
      const fare = strategy.calculateFare(2);
      const expected = Math.max(2 * 15, PRICING_CONFIG.MINIMUM_FARE); // 30, but min is 50
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for 3km (tier 2)', () => {
      const fare = strategy.calculateFare(3);
      const expected = Math.max(2 * 15 + 1 * 12, PRICING_CONFIG.MINIMUM_FARE); // 42, but min is 50
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for 5km', () => {
      const fare = strategy.calculateFare(5);
      const expected = Math.max(2 * 15 + 3 * 12, PRICING_CONFIG.MINIMUM_FARE); // 66, exceeds min
      expect(fare.amount).toBe(expected);
    });

    it('should calculate correctly for 6km (tier 3)', () => {
      const fare = strategy.calculateFare(6);
      const expected = 2 * 15 + 3 * 12 + 1 * 8;
      expect(fare.amount).toBe(expected);
    });

    it('sedan should have higher price than hatchback for same distance', () => {
      const hatchbackStrategy = new HatchbackPricingStrategy();
      const sedanStrategy = new SedanPricingStrategy();
      const distance = 5;
      const hatchbackFare = hatchbackStrategy.calculateFare(distance);
      const sedanFare = sedanStrategy.calculateFare(distance);
      expect(sedanFare.amount).toBeGreaterThan(hatchbackFare.amount);
    });
  });
});
