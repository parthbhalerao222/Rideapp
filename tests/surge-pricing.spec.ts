import {
  DemandBasedSurgePricingPolicy,
  NoSurgePricingPolicy,
  SurgePricingCalculator,
} from '../src/application/strategies/SurgePricing';
import { Money } from '../src/domain/value-objects/Money';

describe('Surge pricing', () => {
  it('keeps the base fare unchanged when surge is disabled', () => {
    const calculator = new SurgePricingCalculator(new NoSurgePricingPolicy());
    expect(calculator.apply(new Money(100), 10, 1).amount).toBe(100);
  });

  it('applies a moderate multiplier when demand exceeds supply', () => {
    const calculator = new SurgePricingCalculator(new DemandBasedSurgePricingPolicy());
    expect(calculator.apply(new Money(100), 3, 2).amount).toBe(125);
  });

  it('applies a high multiplier when demand is at least double supply', () => {
    const calculator = new SurgePricingCalculator(new DemandBasedSurgePricingPolicy());
    expect(calculator.apply(new Money(100), 4, 2).amount).toBe(150);
  });
});
