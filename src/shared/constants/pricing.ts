import { VehicleType } from '../../domain/enums';

export const PRICING_CONFIG = {
  MINIMUM_FARE: 50,
  [VehicleType.HATCHBACK]: {
    TIER_1_KM: 2,
    TIER_1_RATE: 10, // ₹/km for first 2km
    TIER_2_KM: 5,
    TIER_2_RATE: 8, // ₹/km for 2-5km
    TIER_3_RATE: 5, // ₹/km for 5+ km
  },
  [VehicleType.SEDAN]: {
    TIER_1_KM: 2,
    TIER_1_RATE: 15, // ₹/km for first 2km
    TIER_2_KM: 5,
    TIER_2_RATE: 12, // ₹/km for 2-5km
    TIER_3_RATE: 8, // ₹/km for 5+ km
  },
};

export const SEARCH_RADIUS_KM = 5;
