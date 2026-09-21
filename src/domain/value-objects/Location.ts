export class Location {
  constructor(
    readonly latitude: number,
    readonly longitude: number
  ) {}

  /**
   * Calculate distance to another location using Haversine formula.
   * Returns distance in kilometers.
   */
  distanceTo(other: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(other.latitude - this.latitude);
    const dLon = this.toRad(other.longitude - this.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.latitude)) *
        Math.cos(this.toRad(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  equals(other: Location): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }
}
