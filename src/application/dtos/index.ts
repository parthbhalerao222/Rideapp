export interface RegisterUserRequest {
  name: string;
  email: string;
  phone: string;
}

export interface RegisterDriverRequest {
  name: string;
  email: string;
  phone: string;
  vehicleType: 'HATCHBACK' | 'SEDAN';
  licensePlate: string;
  vehicleModel: string;
  latitude: number;
  longitude: number;
}

export interface UpdateDriverLocationRequest {
  latitude: number;
  longitude: number;
}

export interface BookRideRequest {
  userId: string;
  vehicleType: 'HATCHBACK' | 'SEDAN';
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  searchRadiusKm?: number;
  couponCode?: string;
}

export interface EndRideRequest {
  couponCode?: string;
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  expiryDate: string; // ISO date string
  maxDiscount?: number;
}

export interface RideHistoryRequest {
  status?: 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface DriverResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  vehicle: {
    id: string;
    type: string;
    licensePlate: string;
    model: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
}

export interface RideResponse {
  id: string;
  userId: string;
  driverId: string;
  status: string;
  requestedVehicleType: string;
  actualVehicleType: string;
  couponCode?: string;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  distance?: number;
  fare?: number;
  appliedCoupon?: string;
  discountedFare?: number;
  cancellationFee?: number;
  createdAt: string;
}

export interface CouponResponse {
  code: string;
  discountType: string;
  discountValue: number;
  expiryDate: string;
  maxDiscount?: number;
  isValid: boolean;
}
