import { RideService } from '../src/application/services/RideService';
import { DriverService } from '../src/application/services/DriverService';
import { UserService } from '../src/application/services/UserService';
import { InMemoryRideRepository } from '../src/infrastructure/repositories/InMemoryRideRepository';
import { InMemoryDriverRepository } from '../src/infrastructure/repositories/InMemoryDriverRepository';
import { InMemoryUserRepository } from '../src/infrastructure/repositories/InMemoryUserRepository';
import { VehicleType } from '../src/domain/enums';

describe('Ride booking concurrency', () => {
  it('assigns a driver to only one simultaneous booking', async () => {
    const rideRepository = new InMemoryRideRepository();
    const driverRepository = new InMemoryDriverRepository();
    const userRepository = new InMemoryUserRepository();
    const rideService = new RideService(rideRepository, driverRepository, userRepository);
    const driverService = new DriverService(driverRepository);
    const userService = new UserService(userRepository);

    await driverService.registerDriver('Driver', 'driver@example.com', '111', VehicleType.SEDAN, 'PLATE', 'City', 28.7041, 77.1025);
    const firstUser = await userService.registerUser('First', 'first@example.com', '222');
    const secondUser = await userService.registerUser('Second', 'second@example.com', '333');

    const results = await Promise.allSettled([
      rideService.bookRide(firstUser.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.705, 77.103),
      rideService.bookRide(secondUser.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.705, 77.103),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });
});
