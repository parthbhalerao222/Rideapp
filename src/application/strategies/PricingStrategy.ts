import { VehicleType } from '../../domain/enums';
import { Money } from '../../domain/value-objects/Money';
import { PRICING_CONFIG } from '../../shared/constants/pricing';

export interface IPricingStrategy {
  calculateFare(distanceKm: number): Money;
}

export class HatchbackPricingStrategy implements IPricingStrategy {
  calculateFare(distanceKm: number): Money {
    const config = PRICING_CONFIG[VehicleType.HATCHBACK];
    let fare = 0;

    if (distanceKm <= config.TIER_1_KM) {
      fare = distanceKm * config.TIER_1_RATE;
    } else if (distanceKm <= config.TIER_2_KM) {
      fare = config.TIER_1_KM * config.TIER_1_RATE + (distanceKm - config.TIER_1_KM) * config.TIER_2_RATE;
    } else {
      fare =
        config.TIER_1_KM * config.TIER_1_RATE +
        (config.TIER_2_KM - config.TIER_1_KM) * config.TIER_2_RATE +
        (distanceKm - config.TIER_2_KM) * config.TIER_3_RATE;
    }

    const minimumFare = PRICING_CONFIG.MINIMUM_FARE;
    return new Money(Math.max(fare, minimumFare));
  }
}

export class SedanPricingStrategy implements IPricingStrategy {
  calculateFare(distanceKm: number): Money {
    const config = PRICING_CONFIG[VehicleType.SEDAN];
    let fare = 0;

    if (distanceKm <= config.TIER_1_KM) {
      fare = distanceKm * config.TIER_1_RATE;
    } else if (distanceKm <= config.TIER_2_KM) {
      fare = config.TIER_1_KM * config.TIER_1_RATE + (distanceKm - config.TIER_1_KM) * config.TIER_2_RATE;
    } else {
      fare =
        config.TIER_1_KM * config.TIER_1_RATE +
        (config.TIER_2_KM - config.TIER_1_KM) * config.TIER_2_RATE +
        (distanceKm - config.TIER_2_KM) * config.TIER_3_RATE;
    }

    const minimumFare = PRICING_CONFIG.MINIMUM_FARE;
    return new Money(Math.max(fare, minimumFare));
  }
}

export class PricingStrategyFactory {
  static getStrategy(vehicleType: VehicleType): IPricingStrategy {
    switch (vehicleType) {
      case VehicleType.HATCHBACK:
        return new HatchbackPricingStrategy();
      case VehicleType.SEDAN:
        return new SedanPricingStrategy();
      default:
        throw new Error(`Unknown vehicle type: ${vehicleType}`);
    }
  }
}
