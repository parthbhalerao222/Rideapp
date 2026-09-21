import { Ride } from '../../domain/entities/Ride';
import { RideStatus } from '../../domain/enums';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';

export class InMemoryRideRepository implements IRideRepository {
  private rides: Map<string, Ride> = new Map();

  async save(ride: Ride): Promise<void> {
    this.rides.set(ride.id, ride);
  }

  async findById(id: string): Promise<Ride | null> {
    return this.rides.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter((ride) => ride.userId === userId);
  }

  async findByDriverId(driverId: string): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter((ride) => ride.driverId === driverId);
  }

  async findAll(): Promise<Ride[]> {
    return Array.from(this.rides.values());
  }
}
