import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { DriverController } from '../controllers/DriverController';
import { RideController } from '../controllers/RideController';
import { CouponController } from '../controllers/CouponController';

export function createRouter(
  userController: UserController,
  driverController: DriverController,
  rideController: RideController,
  couponController: CouponController
): Router {
  const router = Router();

  // User routes
  router.post('/users', (req, res) => userController.registerUser(req, res));
  router.get('/users', (req, res) => userController.listUsers(req, res));
  router.get('/users/:userId', (req, res) => userController.getUser(req, res));

  // Driver routes
  router.post('/drivers', (req, res) => driverController.registerDriver(req, res));
  router.get('/drivers', (req, res) => driverController.listDrivers(req, res));
  router.get('/drivers/:driverId', (req, res) => driverController.getDriver(req, res));
  router.patch('/drivers/:driverId/location', (req, res) => driverController.updateLocation(req, res));

  // Ride routes
  router.post('/rides', (req, res) => rideController.bookRide(req, res));
  router.post('/rides/:rideId/end', (req, res) => rideController.endRide(req, res));
  router.get('/users/:userId/rides', (req, res) => rideController.getUserRideHistory(req, res));
  router.get('/drivers/:driverId/rides', (req, res) => rideController.getDriverRideHistory(req, res));

  // Coupon routes
  router.post('/coupons', (req, res) => couponController.createCoupon(req, res));
  router.delete('/coupons/:code', (req, res) => couponController.deleteCoupon(req, res));
  router.get('/coupons/:code', (req, res) => couponController.getCoupon(req, res));

  return router;
}
