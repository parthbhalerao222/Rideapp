import { RideStatus, VehicleType } from '../enums';
import { Location } from '../value-objects/Location';
import { Money } from '../value-objects/Money';

export class Ride {
  private status: RideStatus;
  private actualFare: Money | null = null;
  private distanceKm: number | null = null;
  private appliedCouponCode: string | null = null;
  private discountedFare: Money | null = null;
  private cancellationFee: Money | null = null;

  constructor(
    readonly id: string,
    readonly userId: string,
    readonly driverId: string,
    readonly requestedVehicleType: VehicleType,
    readonly actualVehicleType: VehicleType,
    readonly startLocation: Location,
    readonly endLocation: Location,
    readonly createdAt: Date
  ) {
    this.status = RideStatus.REQUESTED;
  }

  static create(
    id: string,
    userId: string,
    driverId: string,
    requestedVehicleType: VehicleType,
    actualVehicleType: VehicleType,
    startLocation: Location,
    endLocation: Location
  ): Ride {
    return new Ride(id, userId, driverId, requestedVehicleType, actualVehicleType, startLocation, endLocation, new Date());
  }

  getStatus(): RideStatus {
    return this.status;
  }

  setStatus(status: RideStatus): void {
    this.status = status;
  }

  startRide(): void {
    if (this.status !== RideStatus.REQUESTED) {
      throw new Error('Ride must be in REQUESTED status to start');
    }
    this.status = RideStatus.ONGOING;
  }

  endRide(actualFare: Money, distanceKm: number): void {
    if (this.status !== RideStatus.ONGOING) {
      throw new Error('Ride must be in ONGOING status to end');
    }
    this.status = RideStatus.COMPLETED;
    this.actualFare = actualFare;
    this.distanceKm = distanceKm;
  }

  cancelRide(cancellationFee: Money): void {
    if (this.status !== RideStatus.ONGOING) {
      throw new Error('Ride must be in ONGOING status to cancel');
    }
    this.status = RideStatus.CANCELLED;
    this.cancellationFee = cancellationFee;
  }

  getActualFare(): Money | null {
    return this.actualFare;
  }

  getDistanceKm(): number | null {
    return this.distanceKm;
  }

  getAppliedCouponCode(): string | null {
    return this.appliedCouponCode;
  }

  getDiscountedFare(): Money | null {
    return this.discountedFare;
  }

  getCancellationFee(): Money | null {
    return this.cancellationFee;
  }

  applyCoupon(couponCode: string, discountedFare: Money): void {
    if (this.status === RideStatus.COMPLETED) {
      throw new Error('Cannot apply coupon to completed ride');
    }
    this.appliedCouponCode = couponCode;
    this.discountedFare = discountedFare;
  }
}
