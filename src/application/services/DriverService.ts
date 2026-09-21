import { Driver } from '../../domain/entities/Driver';
import { Vehicle } from '../../domain/entities/Vehicle';
import { Location } from '../../domain/value-objects/Location';
import { DriverStatus, VehicleType } from '../../domain/enums';
import { IDriverRepository } from '../../domain/interfaces/IDriverRepository';
import { DriverNotFoundError } from '../../shared/errors';
import { IdGenerator } from '../../shared/utils/IdGenerator';

export class DriverService {
  constructor(private driverRepository: IDriverRepository) {}

  async registerDriver(
    name: string,
    email: string,
    phone: string,
    vehicleType: VehicleType,
    licensePlate: string,
    vehicleModel: string,
    latitude: number,
    longitude: number
  ): Promise<Driver> {
    const id = IdGenerator.generateDriverId();
    const vehicleId = `vehicle_${id}`;
    const vehicle = Vehicle.create(vehicleId, vehicleType, licensePlate, vehicleModel);
    const location = new Location(latitude, longitude);
    const driver = Driver.create(id, name, email, phone, vehicle, location);
    driver.setStatus(DriverStatus.AVAILABLE);
    await this.driverRepository.save(driver);
    return driver;
  }

  async getDriverById(driverId: string): Promise<Driver> {
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new DriverNotFoundError(`Driver with id ${driverId} not found`);
    }
    return driver;
  }

  async updateDriverLocation(driverId: string, latitude: number, longitude: number): Promise<Driver> {
    const driver = await this.getDriverById(driverId);
    const newLocation = new Location(latitude, longitude);
    driver.updateLocation(newLocation);
    await this.driverRepository.save(driver);
    return driver;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return this.driverRepository.findAvailableDrivers();
  }

  async getAllDrivers(): Promise<Driver[]> {
    return this.driverRepository.findAll();
  }
}
