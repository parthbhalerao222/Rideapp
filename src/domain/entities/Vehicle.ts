import { Location } from '../value-objects/Location';
import { VehicleType } from '../enums';

export class Vehicle {
  constructor(
    readonly id: string,
    readonly type: VehicleType,
    readonly licensePlate: string,
    readonly model: string
  ) {}

  static create(id: string, type: VehicleType, licensePlate: string, model: string): Vehicle {
    if (!licensePlate || !model) {
      throw new Error('Vehicle must have license plate and model');
    }
    return new Vehicle(id, type, licensePlate, model);
  }
}
