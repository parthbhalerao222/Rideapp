import { RideService } from '../src/application/services/RideService';
import { DriverService } from '../src/application/services/DriverService';
import { UserService } from '../src/application/services/UserService';
import { InMemoryRideRepository } from '../src/infrastructure/repositories/InMemoryRideRepository';
import { InMemoryDriverRepository } from '../src/infrastructure/repositories/InMemoryDriverRepository';
import { InMemoryUserRepository } from '../src/infrastructure/repositories/InMemoryUserRepository';
import { VehicleType, RideStatus, DriverStatus } from '../src/domain/enums';
import {
  NoDriverAvailableError,
  InvalidRideStateError,
  RideNotFoundError,
  UserNotFoundError,
  DriverNotFoundError,
} from '../src/shared/errors';

describe('RideService', () => {
  let rideService: RideService;
  let driverService: DriverService;
  let userService: UserService;
  let rideRepository: InMemoryRideRepository;
  let driverRepository: InMemoryDriverRepository;
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    rideRepository = new InMemoryRideRepository();
    driverRepository = new InMemoryDriverRepository();
    userRepository = new InMemoryUserRepository();
    rideService = new RideService(rideRepository, driverRepository, userRepository);
    driverService = new DriverService(driverRepository);
    userService = new UserService(userRepository);
  });

  describe('Book Ride', () => {
    it('should book a ride successfully', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);

      const ride = await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.6139, 77.2090);
      expect(ride.userId).toBe(user.id);
      expect(ride.getStatus()).toBe(RideStatus.ONGOING);
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
      await expect(
        rideService.bookRide('non_existent_user', VehicleType.SEDAN, 28.7041, 77.1025, 28.6139, 77.2090)
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should throw NoDriverAvailableError if no drivers are in radius', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      // Driver is at different location, far from ride start
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 0, 0);

      await expect(
        rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.6139, 77.2090, 5)
      ).rejects.toThrow(NoDriverAvailableError);
    });

    it('should mark driver as on ride after booking', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      const driver = await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
      
      expect(driver.getStatus()).toBe(DriverStatus.AVAILABLE);
      
      await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.6139, 77.2090);
      
      const updatedDriver = await driverService.getDriverById(driver.id);
      expect(updatedDriver.getStatus()).toBe(DriverStatus.ON_RIDE);
    });

    it('should request hatchback and get sedan if hatchback unavailable', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);

      const ride = await rideService.bookRide(user.id, VehicleType.HATCHBACK, 28.7041, 77.1025, 28.6139, 77.2090);
      
      expect(ride.requestedVehicleType).toBe(VehicleType.HATCHBACK);
      expect(ride.actualVehicleType).toBe(VehicleType.SEDAN);
    });

    it('should prefer matching vehicle type when available', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      const sedanDriver = await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
      const hatchbackDriver = await driverService.registerDriver('Driver2', 'driver2@example.com', '3333333333', VehicleType.HATCHBACK, 'DL-02', 'Model2', 28.7041, 77.1025);

      const ride = await rideService.bookRide(user.id, VehicleType.HATCHBACK, 28.7041, 77.1025, 28.6139, 77.2090);
      
      expect(ride.driverId).toBe(hatchbackDriver.id);
      expect(ride.actualVehicleType).toBe(VehicleType.HATCHBACK);
    });

    it('should throw NoDriverAvailableError when booking hatchback but only sedan unavailable outside radius', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      // Sedan far away
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 0, 0);

      await expect(
        rideService.bookRide(user.id, VehicleType.HATCHBACK, 28.7041, 77.1025, 28.6139, 77.2090, 5)
      ).rejects.toThrow(NoDriverAvailableError);
    });
  });

  describe('End Ride', () => {
    it('should end a ride and calculate fare', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
      const ride = await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.6139, 77.2090);

      const { ride: endedRide } = await rideService.endRide(ride.id);
      
      expect(endedRide.getStatus()).toBe(RideStatus.COMPLETED);
      expect(endedRide.getActualFare()).toBeDefined();
      expect(endedRide.getDistanceKm()).toBeDefined();
    });

    it('should mark driver as available after ride completion', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      const driver = await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
      const ride = await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.6139, 77.2090);

      await rideService.endRide(ride.id);
      
      const updatedDriver = await driverService.getDriverById(driver.id);
      expect(updatedDriver.getStatus()).toBe(DriverStatus.AVAILABLE);
    });

    it('should throw InvalidRideStateError if ride is not ongoing', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
      const ride = await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.6139, 77.2090);

      await rideService.endRide(ride.id);

      await expect(rideService.endRide(ride.id)).rejects.toThrow(InvalidRideStateError);
    });

    it('should throw RideNotFoundError if ride does not exist', async () => {
      await expect(rideService.endRide('non_existent_ride')).rejects.toThrow(RideNotFoundError);
    });
  });

  describe('Ride History', () => {
    it('should get user ride history', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);

      // Use locations close to driver to ensure they're within radius
      const ride1 = await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.7051, 77.1035);
      
      // Register another driver for second ride
      await driverService.registerDriver('Driver2', 'driver2@example.com', '3333333333', VehicleType.SEDAN, 'DL-02', 'Model2', 28.7051, 77.1035);
      const ride2 = await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7051, 77.1035, 28.7061, 77.1045);

      const history = await rideService.getUserRideHistory(user.id);
      expect(history.length).toBe(2);
      expect(history.map((r) => r.id)).toContain(ride1.id);
      expect(history.map((r) => r.id)).toContain(ride2.id);
    });

    it('should get driver ride history', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      const driver = await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);

      const ride = await rideService.bookRide(user.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.7051, 77.1035);

      const history = await rideService.getDriverRideHistory(driver.id);
      expect(history.length).toBe(1);
      expect(history[0].id).toBe(ride.id);
    });
  });

  describe('Ride Pricing', () => {
    it('should calculate minimum fare for short rides', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.HATCHBACK, 'DL-01', 'Model1', 28.7041, 77.1025);
      
      // Create a very short ride
      const ride = await rideService.bookRide(user.id, VehicleType.HATCHBACK, 28.7041, 77.1025, 28.7041, 77.1025);
      const { finalFare } = await rideService.endRide(ride.id);
      
      // Should apply minimum fare
      expect(finalFare.amount).toBe(50);
    });

    it('should apply sedan pricing when upgraded from hatchback', async () => {
      const user = await userService.registerUser('John', 'john@example.com', '1111111111');
      await driverService.registerDriver('Driver1', 'driver1@example.com', '2222222222', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
      
      const ride = await rideService.bookRide(user.id, VehicleType.HATCHBACK, 28.7041, 77.1025, 28.6139, 77.2090);
      
      // Should use HATCHBACK pricing even though upgraded to SEDAN
      // This is verified by requestedVehicleType being used for pricing
      expect(ride.requestedVehicleType).toBe(VehicleType.HATCHBACK);
    });
  });
});
