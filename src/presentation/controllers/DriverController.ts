import { Request, Response } from 'express';
import { DriverService } from '../../application/services/DriverService';
import { VehicleType } from '../../domain/enums';
import { DriverResponse } from '../../application/dtos';

export class DriverController {
  constructor(private driverService: DriverService) {}

  async registerDriver(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, vehicleType, licensePlate, vehicleModel, latitude, longitude } = req.body;
      if (!name || !email || !phone || !vehicleType || !licensePlate || !vehicleModel || latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }
      const driver = await this.driverService.registerDriver(
        name,
        email,
        phone,
        vehicleType as VehicleType,
        licensePlate,
        vehicleModel,
        latitude,
        longitude
      );
      res.status(201).json(this.driverToResponse(driver));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getDriver(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.params.driverId as string;
      const driver = await this.driverService.getDriverById(driverId);
      res.status(200).json(this.driverToResponse(driver));
    } catch (error) {
      const statusCode = error instanceof Error && error.constructor.name === 'DriverNotFoundError' ? 404 : 500;
      res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.params.driverId as string;
      const { latitude, longitude } = req.body;
      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: 'latitude and longitude are required' });
        return;
      }
      const driver = await this.driverService.updateDriverLocation(driverId, latitude, longitude);
      res.status(200).json(this.driverToResponse(driver));
    } catch (error) {
      const statusCode = error instanceof Error && error.constructor.name === 'DriverNotFoundError' ? 404 : 500;
      res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private driverToResponse(driver: any): DriverResponse {
    return {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      status: driver.getStatus(),
      vehicle: {
        id: driver.vehicle.id,
        type: driver.vehicle.type,
        licensePlate: driver.vehicle.licensePlate,
        model: driver.vehicle.model,
      },
      location: {
        latitude: driver.getLocation().latitude,
        longitude: driver.getLocation().longitude,
      },
    };
  }
}
