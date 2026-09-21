import { Ride } from '../../domain/entities/Ride';
import { Location } from '../../domain/value-objects/Location';
import { Money } from '../../domain/value-objects/Money';
import { VehicleType, DriverStatus, RideStatus } from '../../domain/enums';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { IDriverRepository } from '../../domain/interfaces/IDriverRepository';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import {
  RideNotFoundError,
  InvalidRideStateError,
  NoDriverAvailableError,
  UserNotFoundError,
  DriverNotFoundError,
} from '../../shared/errors';
import { IdGenerator } from '../../shared/utils/IdGenerator';
import { PricingStrategyFactory } from '../strategies/PricingStrategy';
import {
  DriverMatchingStrategy,
  NearestDriverMatchingStrategy,
} from '../strategies/DriverMatchingStrategy';
import {
  NoSurgePricingPolicy,
  SurgePricingCalculator,
  SurgePricingPolicy,
} from '../strategies/SurgePricing';
import {
  CancellationPolicy,
  PercentageCancellationPolicy,
} from '../strategies/CancellationPolicy';
import { CouponService } from './CouponService';
import { SEARCH_RADIUS_KM } from '../../shared/constants/pricing';

export class RideService {
  private readonly reservedDriverIds = new Set<string>();

  constructor(
    private rideRepository: IRideRepository,
    private driverRepository: IDriverRepository,
    private userRepository: IUserRepository,
    private matchingStrategy: DriverMatchingStrategy = new NearestDriverMatchingStrategy(),
    surgePricingPolicy: SurgePricingPolicy = new NoSurgePricingPolicy(),
    private cancellationPolicy: CancellationPolicy = new PercentageCancellationPolicy(),
    private couponService?: CouponService
  ) {
    this.surgePricingCalculator = new SurgePricingCalculator(surgePricingPolicy);
  }

  private readonly surgePricingCalculator: SurgePricingCalculator;

  async bookRide(
    userId: string,
    requestedVehicleType: VehicleType,
    startLatitude: number,
    startLongitude: number,
    endLatitude: number,
    endLongitude: number,
    searchRadiusKm: number = SEARCH_RADIUS_KM,
    couponCode?: string
  ): Promise<Ride> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User ${userId} not found`);
    }
    if (couponCode) {
      if (!this.couponService) {
        throw new Error('Coupon service is not configured');
      }
      await this.couponService.validateAndGetCoupon(couponCode);
    }

    const startLocation = new Location(startLatitude, startLongitude);
    const endLocation = new Location(endLatitude, endLongitude);

    // Find available drivers within radius
    const availableDrivers = await this.driverRepository.findAvailableDrivers();
    const driversInRadius = availableDrivers.filter(
      (driver) =>
        !this.reservedDriverIds.has(driver.id) &&
        driver.getLocation().distanceTo(startLocation) <= searchRadiusKm
    );

    if (driversInRadius.length === 0) {
      throw new NoDriverAvailableError(`No drivers available within ${searchRadiusKm}km radius`);
    }

    // First, try to find a driver with the requested vehicle type
    let selectedDriver = this.matchingStrategy.selectDriver(
      driversInRadius.filter((driver) => driver.vehicle.type === requestedVehicleType),
      startLocation
    );
    let actualVehicleType = requestedVehicleType;

    // If requested type is Hatchback but not available, upgrade to Sedan
    if (!selectedDriver && requestedVehicleType === VehicleType.HATCHBACK) {
      selectedDriver = this.matchingStrategy.selectDriver(
        driversInRadius.filter((driver) => driver.vehicle.type === VehicleType.SEDAN),
        startLocation
      );
      if (selectedDriver) {
        actualVehicleType = VehicleType.SEDAN;
      }
    }

    if (!selectedDriver) {
      throw new NoDriverAvailableError(`No ${requestedVehicleType} available within ${searchRadiusKm}km radius`);
    }

    this.reservedDriverIds.add(selectedDriver.id);

    // Create and save ride
    try {
      const rideId = IdGenerator.generateRideId();
      const ride = Ride.create(rideId, userId, selectedDriver.id, requestedVehicleType, actualVehicleType, startLocation, endLocation);
      if (couponCode) {
        ride.setCouponCode(couponCode);
      }
      ride.startRide();

      selectedDriver.setStatus(DriverStatus.ON_RIDE);

      await this.rideRepository.save(ride);
      await this.driverRepository.save(selectedDriver);

      return ride;
    } catch (error) {
      this.reservedDriverIds.delete(selectedDriver.id);
      throw error;
    }
  }

  async endRide(rideId: string): Promise<{ ride: Ride; finalFare: Money }> {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(`Ride ${rideId} not found`);
    }

    if (ride.getStatus() !== RideStatus.ONGOING) {
      throw new InvalidRideStateError(`Ride must be in ONGOING status to end. Current status: ${ride.getStatus()}`);
    }

    // Calculate distance and fare
    const distanceKm = ride.startLocation.distanceTo(ride.endLocation);
    const pricingStrategy = PricingStrategyFactory.getStrategy(ride.requestedVehicleType);
    const baseFare = pricingStrategy.calculateFare(distanceKm);
    const activeRides = (await this.rideRepository.findAll()).filter(
      (activeRide) => activeRide.getStatus() === RideStatus.ONGOING
    ).length;
    const availableDrivers = (await this.driverRepository.findAvailableDrivers()).length + 1;
    const finalFare = this.surgePricingCalculator.apply(baseFare, activeRides, availableDrivers);
    let discountedFare = finalFare;
    const couponCode = ride.getCouponCode();
    if (couponCode) {
      if (!this.couponService) {
        throw new Error('Coupon service is not configured');
      }
      discountedFare = await this.couponService.applyCoupon(couponCode, finalFare);
    }

    if (couponCode) {
      ride.applyCoupon(couponCode, discountedFare);
    }
    ride.endRide(discountedFare, distanceKm);

    // Mark driver as available
    const driver = await this.driverRepository.findById(ride.driverId);
    if (!driver) {
      throw new DriverNotFoundError(`Driver ${ride.driverId} not found`);
    }

    driver.setStatus(DriverStatus.AVAILABLE);

    await this.rideRepository.save(ride);
    await this.driverRepository.save(driver);
    this.reservedDriverIds.delete(driver.id);

    return { ride, finalFare: discountedFare };
  }

  async getUserRideHistory(userId: string): Promise<Ride[]> {
    return this.rideRepository.findByUserId(userId);
  }

  async cancelRide(rideId: string): Promise<{ ride: Ride; cancellationFee: Money }> {
    const ride = await this.getRideById(rideId);
    if (ride.getStatus() !== RideStatus.ONGOING) {
      throw new InvalidRideStateError(`Ride must be in ONGOING status to cancel. Current status: ${ride.getStatus()}`);
    }

    const distanceKm = ride.startLocation.distanceTo(ride.endLocation);
    const baseFare = PricingStrategyFactory.getStrategy(ride.requestedVehicleType).calculateFare(distanceKm);
    const cancellationFee = this.cancellationPolicy.calculateFee(baseFare);
    ride.cancelRide(cancellationFee);

    const driver = await this.driverRepository.findById(ride.driverId);
    if (!driver) {
      throw new DriverNotFoundError(`Driver ${ride.driverId} not found`);
    }
    driver.setStatus(DriverStatus.AVAILABLE);
    await this.rideRepository.save(ride);
    await this.driverRepository.save(driver);
    this.reservedDriverIds.delete(driver.id);
    return { ride, cancellationFee };
  }

  async getDriverRideHistory(driverId: string): Promise<Ride[]> {
    return this.rideRepository.findByDriverId(driverId);
  }

  async getRideById(rideId: string): Promise<Ride> {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(`Ride ${rideId} not found`);
    }
    return ride;
  }
}
