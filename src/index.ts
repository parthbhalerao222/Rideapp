import express from 'express';
import { UserService } from './application/services/UserService';
import { DriverService } from './application/services/DriverService';
import { RideService } from './application/services/RideService';
import { CouponService } from './application/services/CouponService';
import { UserController } from './presentation/controllers/UserController';
import { DriverController } from './presentation/controllers/DriverController';
import { RideController } from './presentation/controllers/RideController';
import { CouponController } from './presentation/controllers/CouponController';
import { createRouter } from './presentation/routes';
import { InMemoryUserRepository } from './infrastructure/repositories/InMemoryUserRepository';
import { InMemoryDriverRepository } from './infrastructure/repositories/InMemoryDriverRepository';
import { InMemoryRideRepository } from './infrastructure/repositories/InMemoryRideRepository';
import { InMemoryCouponRepository } from './infrastructure/repositories/InMemoryCouponRepository';

const PORT = process.env.PORT || 3000;

function initializeApp() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Initialize repositories
  const userRepository = new InMemoryUserRepository();
  const driverRepository = new InMemoryDriverRepository();
  const rideRepository = new InMemoryRideRepository();
  const couponRepository = new InMemoryCouponRepository();

  // Initialize services
  const userService = new UserService(userRepository);
  const driverService = new DriverService(driverRepository);
  const rideService = new RideService(rideRepository, driverRepository, userRepository);
  const couponService = new CouponService(couponRepository);

  // Initialize controllers
  const userController = new UserController(userService);
  const driverController = new DriverController(driverService);
  const rideController = new RideController(rideService, couponService);
  const couponController = new CouponController(couponService);

  // Routes
  const router = createRouter(userController, driverController, rideController, couponController);
  app.use('/api', router);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Error handling for 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

// Start server if running directly
if (require.main === module) {
  const app = initializeApp();
  app.listen(PORT, () => {
    console.log(`Ride Hailing Service running on port ${PORT}`);
  });
}

export { initializeApp };
