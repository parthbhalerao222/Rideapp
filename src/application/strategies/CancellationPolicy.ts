import { Money } from '../../domain/value-objects/Money';

export interface CancellationPolicy {
  calculateFee(baseFare: Money): Money;
}

export class PercentageCancellationPolicy implements CancellationPolicy {
  constructor(private readonly percentage = 0.1) {}

  calculateFee(baseFare: Money): Money {
    return baseFare.multiply(this.percentage);
  }
}
