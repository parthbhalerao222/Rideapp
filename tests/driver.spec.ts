import { DriverService } from '../src/application/services/DriverService';
import { InMemoryDriverRepository } from '../src/infrastructure/repositories/InMemoryDriverRepository';
import { VehicleType, DriverStatus } from '../src/domain/enums';
import { DriverNotFoundError } from '../src/shared/errors';

describe('DriverService', () => {
  let driverService: DriverService;
  let driverRepository: InMemoryDriverRepository;

  beforeEach(() => {
    driverRepository = new InMemoryDriverRepository();
    driverService = new DriverService(driverRepository);
  });

  it('should register a new driver', async () => {
    const driver = await driverService.registerDriver(
      'John Driver',
      'john@driver.com',
      '9876543210',
      VehicleType.SEDAN,
      'DL-01-AB-1234',
      'Honda Accord',
      28.7041,
      77.1025
    );
    expect(driver.name).toBe('John Driver');
    expect(driver.email).toBe('john@driver.com');
    expect(driver.vehicle.type).toBe(VehicleType.SEDAN);
    expect(driver.getStatus()).toBe(DriverStatus.AVAILABLE);
  });

  it('should retrieve driver by id', async () => {
    const registered = await driverService.registerDriver(
      'Jane Driver',
      'jane@driver.com',
      '8765432109',
      VehicleType.HATCHBACK,
      'KA-01-CD-5678',
      'Hyundai i20',
      28.7041,
      77.1025
    );
    const retrieved = await driverService.getDriverById(registered.id);
    expect(retrieved.id).toBe(registered.id);
    expect(retrieved.name).toBe('Jane Driver');
  });

  it('should throw DriverNotFoundError if driver does not exist', async () => {
    await expect(driverService.getDriverById('non_existent_id')).rejects.toThrow(DriverNotFoundError);
  });

  it('should update driver location', async () => {
    const driver = await driverService.registerDriver(
      'Bob Driver',
      'bob@driver.com',
      '7654321098',
      VehicleType.SEDAN,
      'MH-01-EF-9012',
      'Maruti Swift',
      28.7041,
      77.1025
    );
    const updated = await driverService.updateDriverLocation(driver.id, 28.6139, 77.2090);
    expect(updated.getLocation().latitude).toBe(28.6139);
    expect(updated.getLocation().longitude).toBe(77.2090);
  });

  it('should get available drivers', async () => {
    await driverService.registerDriver('Driver1', 'driver1@example.com', '1111111111', VehicleType.SEDAN, 'DL-01', 'Model1', 28.7041, 77.1025);
    await driverService.registerDriver('Driver2', 'driver2@example.com', '2222222222', VehicleType.HATCHBACK, 'DL-02', 'Model2', 28.7041, 77.1025);
    const available = await driverService.getAvailableDrivers();
    expect(available.length).toBe(2);
    expect(available.every((d) => d.isAvailable())).toBe(true);
  });
});
