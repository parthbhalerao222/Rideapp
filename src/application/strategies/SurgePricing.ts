import { Money } from '../../domain/value-objects/Money';

export interface SurgePricingPolicy {
  getMultiplier(activeRides: number, availableDrivers: number): number;
}

export class NoSurgePricingPolicy implements SurgePricingPolicy {
  getMultiplier(): number {
    return 1;
  }
}

export class DemandBasedSurgePricingPolicy implements SurgePricingPolicy {
  constructor(
    private readonly moderateMultiplier = 1.25,
    private readonly highMultiplier = 1.5
  ) {}

  getMultiplier(activeRides: number, availableDrivers: number): number {
    if (availableDrivers === 0 || activeRides >= availableDrivers * 2) {
      return this.highMultiplier;
    }
    if (activeRides > availableDrivers) {
      return this.moderateMultiplier;
    }
    return 1;
  }
}

export class SurgePricingCalculator {
  constructor(private readonly policy: SurgePricingPolicy) {}

  apply(baseFare: Money, activeRides: number, availableDrivers: number): Money {
    return baseFare.multiply(this.policy.getMultiplier(activeRides, availableDrivers));
  }
}
