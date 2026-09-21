export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundError extends DomainError {}
export class DriverNotFoundError extends DomainError {}
export class RideNotFoundError extends DomainError {}
export class NoDriverAvailableError extends DomainError {}
export class InvalidRideStateError extends DomainError {}
export class InvalidCouponError extends DomainError {}
export class CouponExpiredError extends DomainError {}
export class CouponNotFoundError extends DomainError {}
export class InvalidVehicleError extends DomainError {}
