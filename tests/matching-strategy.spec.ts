import {
  HighestRatedDriverMatchingStrategy,
  NearestDriverMatchingStrategy,
} from '../src/application/strategies/DriverMatchingStrategy';
import { DriverService } from '../src/application/services/DriverService';
import { InMemoryDriverRepository } from '../src/infrastructure/repositories/InMemoryDriverRepository';
import { VehicleType } from '../src/domain/enums';
import { Location } from '../src/domain/value-objects/Location';

describe('Driver matching strategies', () => {
  const location = new Location(28.7041, 77.1025);

  async function createDrivers() {
    const service = new DriverService(new InMemoryDriverRepository());
    const nearest = await service.registerDriver(
      'Nearest',
      'nearest@example.com',
      '111',
      VehicleType.SEDAN,
      'NEAR',
      'City',
      28.7041,
      77.1025
    );
    const farther = await service.registerDriver(
      'Farther',
      'farther@example.com',
      '222',
      VehicleType.SEDAN,
      'FAR',
      'City',
      28.8,
      77.2
    );
    farther.setRating(4);
    nearest.setRating(3);
    return { nearest, farther };
  }

  it('selects the nearest available driver', async () => {
    const { nearest, farther } = await createDrivers();
    const selected = new NearestDriverMatchingStrategy().selectDriver([farther, nearest], location);
    expect(selected?.id).toBe(nearest.id);
  });

  it('selects the highest-rated driver before distance', async () => {
    const { nearest, farther } = await createDrivers();
    const selected = new HighestRatedDriverMatchingStrategy().selectDriver([nearest, farther], location);
    expect(selected?.id).toBe(farther.id);
  });
});
