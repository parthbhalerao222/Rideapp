import { Location } from '../value-objects/Location';
import { Vehicle } from './Vehicle';
import { DriverStatus } from '../enums';

export class Driver {
  private status: DriverStatus = DriverStatus.OFFLINE;
  private location: Location;

  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly phone: string,
    readonly vehicle: Vehicle,
    initialLocation: Location
  ) {
    this.location = initialLocation;
  }

  static create(
    id: string,
    name: string,
    email: string,
    phone: string,
    vehicle: Vehicle,
    location: Location
  ): Driver {
    if (!name || !email || !phone) {
      throw new Error('Driver must have name, email, and phone');
    }
    return new Driver(id, name, email, phone, vehicle, location);
  }

  getStatus(): DriverStatus {
    return this.status;
  }

  setStatus(status: DriverStatus): void {
    this.status = status;
  }

  getLocation(): Location {
    return this.location;
  }

  updateLocation(location: Location): void {
    this.location = location;
  }

  isAvailable(): boolean {
    return this.status === DriverStatus.AVAILABLE;
  }
}
