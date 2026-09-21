import { PercentageCancellationPolicy } from '../src/application/strategies/CancellationPolicy';
import { Money } from '../src/domain/value-objects/Money';

describe('Cancellation policy', () => {
  it('charges ten percent of the calculated fare by default', () => {
    const fee = new PercentageCancellationPolicy().calculateFee(new Money(150));
    expect(fee.amount).toBe(15);
  });
});
