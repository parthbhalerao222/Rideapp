import { Request, Response } from 'express';
import { RideService } from '../../application/services/RideService';
import { CouponService } from '../../application/services/CouponService';
import { VehicleType, RideStatus } from '../../domain/enums';
import { RideResponse } from '../../application/dtos';

export class RideController {
  constructor(private rideService: RideService, private couponService: CouponService) {}

  async bookRide(req: Request, res: Response): Promise<void> {
    try {
      const { userId, vehicleType, startLatitude, startLongitude, endLatitude, endLongitude, searchRadiusKm } = req.body;
      if (!userId || !vehicleType || startLatitude === undefined || startLongitude === undefined || endLatitude === undefined || endLongitude === undefined) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
      }
      const ride = await this.rideService.bookRide(userId, vehicleType as VehicleType, startLatitude, startLongitude, endLatitude, endLongitude, searchRadiusKm);
      res.status(201).json(this.rideToResponse(ride));
    } catch (error) {
      const statusCode = this.getErrorStatusCode(error);
      res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async endRide(req: Request, res: Response): Promise<void> {
    try {
      const rideId = req.params.rideId as string;
      const { couponCode } = req.body;

      const { ride, finalFare } = await this.rideService.endRide(rideId, couponCode);

      let discountedFare: number | undefined;
      if (couponCode) {
        try {
          const discounted = await this.couponService.applyCoupon(couponCode, finalFare);
          discountedFare = discounted.amount;
          ride.applyCoupon(couponCode, discounted);
        } catch (error) {
          // Coupon validation fails, but ride still completes with base fare
        }
      }

      res.status(200).json(this.rideToResponse(ride));
    } catch (error) {
      const statusCode = this.getErrorStatusCode(error);
      res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }

  }

  async cancelRide(req: Request, res: Response): Promise<void> {
    try {
      const rideId = req.params.rideId as string;
      const { ride, cancellationFee } = await this.rideService.cancelRide(rideId);
      res.status(200).json({
        ...this.rideToResponse(ride),
        cancellationFee: cancellationFee.amount,
      });
    } catch (error) {
      const statusCode = this.getErrorStatusCode(error);
      res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getUserRideHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const rides = await this.rideService.getUserRideHistory(userId);
      res.status(200).json(rides.map((ride: any) => this.rideToResponse(ride)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getDriverRideHistory(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.params.driverId as string;
      const rides = await this.rideService.getDriverRideHistory(driverId);
      res.status(200).json(rides.map((ride: any) => this.rideToResponse(ride)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private rideToResponse(ride: any): RideResponse {
    return {
      id: ride.id,
      userId: ride.userId,
      driverId: ride.driverId,
      status: ride.getStatus(),
      requestedVehicleType: ride.requestedVehicleType,
      actualVehicleType: ride.actualVehicleType,
      startLocation: {
        latitude: ride.startLocation.latitude,
        longitude: ride.startLocation.longitude,
      },
      endLocation: {
        latitude: ride.endLocation.latitude,
        longitude: ride.endLocation.longitude,
      },
      distance: ride.getDistanceKm() ?? undefined,
      fare: ride.getActualFare()?.amount ?? undefined,
      appliedCoupon: ride.getAppliedCouponCode() ?? undefined,
      discountedFare: ride.getDiscountedFare()?.amount ?? undefined,
      cancellationFee: ride.getCancellationFee()?.amount ?? undefined,
      createdAt: ride.createdAt.toISOString(),
    };
  }

  private getErrorStatusCode(error: any): number {
    const errorName = error?.constructor?.name;
    if (errorName === 'RideNotFoundError' || errorName === 'UserNotFoundError' || errorName === 'DriverNotFoundError') {
      return 404;
    }
    if (errorName === 'InvalidRideStateError' || errorName === 'NoDriverAvailableError') {
      return 400;
    }
    return 500;
  }
}
