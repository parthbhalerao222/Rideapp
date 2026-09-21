import { Location } from '../src/domain/value-objects/Location';

describe('Location Value Object', () => {
  it('should create a location with latitude and longitude', () => {
    const location = new Location(28.7041, 77.1025);
    expect(location.latitude).toBe(28.7041);
    expect(location.longitude).toBe(77.1025);
  });

  it('should calculate distance between two locations', () => {
    // New Delhi and Bangalore are approximately 2000 km apart
    const delhi = new Location(28.7041, 77.1025);
    const bangalore = new Location(12.9716, 77.5946);
    const distance = delhi.distanceTo(bangalore);
    // Distance should be around 2000 km (allowing some tolerance for great-circle calculation)
    expect(distance).toBeGreaterThan(1700);
    expect(distance).toBeLessThan(2100);
  });

  it('should return 0 for same location', () => {
    const location1 = new Location(28.7041, 77.1025);
    const location2 = new Location(28.7041, 77.1025);
    const distance = location1.distanceTo(location2);
    expect(distance).toBe(0);
  });

  it('should calculate distance for short distances (< 1km)', () => {
    // Two points close to each other
    const point1 = new Location(28.7041, 77.1025);
    const point2 = new Location(28.7042, 77.1026);
    const distance = point1.distanceTo(point2);
    // Should be less than 1km for such small difference
    expect(distance).toBeLessThan(0.2);
  });

  it('should have equals method for location comparison', () => {
    const location1 = new Location(28.7041, 77.1025);
    const location2 = new Location(28.7041, 77.1025);
    const location3 = new Location(12.9716, 77.5946);
    expect(location1.equals(location2)).toBe(true);
    expect(location1.equals(location3)).toBe(false);
  });
});
