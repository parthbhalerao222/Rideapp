import { Driver } from '../entities/Driver';

export interface IDriverRepository {
  save(driver: Driver): Promise<void>;
  findById(id: string): Promise<Driver | null>;
  findAll(): Promise<Driver[]>;
  findAvailableDrivers(): Promise<Driver[]>;
}
