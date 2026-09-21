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
import { SEARCH_RADIUS_KM } from '../../shared/constants/pricing';

export class RideService {
  constructor(
    private rideRepository: IRideRepository,
    private driverRepository: IDriverRepository,
    private userRepository: IUserRepository
  ) {}

  async bookRide(
    userId: string,
    requestedVehicleType: VehicleType,
    startLatitude: number,
    startLongitude: number,
    endLatitude: number,
    endLongitude: number,
    searchRadiusKm: number = SEARCH_RADIUS_KM
  ): Promise<Ride> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User ${userId} not found`);
    }

    const startLocation = new Location(startLatitude, startLongitude);
    const endLocation = new Location(endLatitude, endLongitude);

    // Find available drivers within radius
    const availableDrivers = await this.driverRepository.findAvailableDrivers();
    const driversInRadius = availableDrivers.filter(
      (driver) => driver.getLocation().distanceTo(startLocation) <= searchRadiusKm
    );

    if (driversInRadius.length === 0) {
      throw new NoDriverAvailableError(`No drivers available within ${searchRadiusKm}km radius`);
    }

    // First, try to find a driver with the requested vehicle type
    let selectedDriver = driversInRadius.find((driver) => driver.vehicle.type === requestedVehicleType);
    let actualVehicleType = requestedVehicleType;

    // If requested type is Hatchback but not available, upgrade to Sedan
    if (!selectedDriver && requestedVehicleType === VehicleType.HATCHBACK) {
      selectedDriver = driversInRadius.find((driver) => driver.vehicle.type === VehicleType.SEDAN);
      if (selectedDriver) {
        actualVehicleType = VehicleType.SEDAN;
      }
    }

    if (!selectedDriver) {
      throw new NoDriverAvailableError(`No ${requestedVehicleType} available within ${searchRadiusKm}km radius`);
    }

    // Create and save ride
    const rideId = IdGenerator.generateRideId();
    const ride = Ride.create(rideId, userId, selectedDriver.id, requestedVehicleType, actualVehicleType, startLocation, endLocation);
    ride.startRide();

    // Mark driver as on ride
    selectedDriver.setStatus(DriverStatus.ON_RIDE);

    await this.rideRepository.save(ride);
    await this.driverRepository.save(selectedDriver);

    return ride;
  }

  async endRide(rideId: string, couponCode?: string): Promise<{ ride: Ride; finalFare: Money }> {
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

    let finalFare = baseFare;
    if (couponCode) {
      // Apply coupon separately (CouponService will handle validation)
      // For now, just store it; the controller will handle coupon application
    }

    ride.endRide(finalFare, distanceKm);

    // Mark driver as available
    const driver = await this.driverRepository.findById(ride.driverId);
    if (!driver) {
      throw new DriverNotFoundError(`Driver ${ride.driverId} not found`);
    }

    driver.setStatus(DriverStatus.AVAILABLE);

    await this.rideRepository.save(ride);
    await this.driverRepository.save(driver);

    return { ride, finalFare };
  }

  async getUserRideHistory(userId: string): Promise<Ride[]> {
    return this.rideRepository.findByUserId(userId);
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
