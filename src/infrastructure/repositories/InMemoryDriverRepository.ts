import { Driver } from '../../domain/entities/Driver';
import { DriverStatus } from '../../domain/enums';
import { IDriverRepository } from '../../domain/interfaces/IDriverRepository';

export class InMemoryDriverRepository implements IDriverRepository {
  private drivers: Map<string, Driver> = new Map();

  async save(driver: Driver): Promise<void> {
    this.drivers.set(driver.id, driver);
  }

  async findById(id: string): Promise<Driver | null> {
    return this.drivers.get(id) || null;
  }

  async findAll(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async findAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter((driver) => driver.isAvailable());
  }
}
