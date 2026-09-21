import { Driver } from '../../domain/entities/Driver';
import { Location } from '../../domain/value-objects/Location';

export interface DriverMatchingStrategy {
  selectDriver(drivers: Driver[], pickup: Location): Driver | undefined;
}

export class NearestDriverMatchingStrategy implements DriverMatchingStrategy {
  selectDriver(drivers: Driver[], pickup: Location): Driver | undefined {
    return [...drivers].sort(
      (left, right) =>
        left.getLocation().distanceTo(pickup) - right.getLocation().distanceTo(pickup)
    )[0];
  }
}

export class HighestRatedDriverMatchingStrategy implements DriverMatchingStrategy {
  selectDriver(drivers: Driver[], pickup: Location): Driver | undefined {
    return [...drivers].sort((left, right) => {
      const ratingDifference = right.getRating() - left.getRating();
      if (ratingDifference !== 0) return ratingDifference;
      return left.getLocation().distanceTo(pickup) - right.getLocation().distanceTo(pickup);
    })[0];
  }
}
