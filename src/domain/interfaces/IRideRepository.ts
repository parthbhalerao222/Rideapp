import { Ride } from '../entities/Ride';

export interface IRideRepository {
  save(ride: Ride): Promise<void>;
  findById(id: string): Promise<Ride | null>;
  findByUserId(userId: string): Promise<Ride[]>;
  findByDriverId(driverId: string): Promise<Ride[]>;
  findAll(): Promise<Ride[]>;
}
