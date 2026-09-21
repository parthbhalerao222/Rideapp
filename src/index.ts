import express from 'express';
import path from 'path';
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
import { VehicleType } from './domain/enums';

const PORT = process.env.PORT || 3000;

function initializeApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Initialize repositories
  const userRepository = new InMemoryUserRepository();
  const driverRepository = new InMemoryDriverRepository();
  const rideRepository = new InMemoryRideRepository();
  const couponRepository = new InMemoryCouponRepository();

  // Initialize services
  const userService = new UserService(userRepository);
  const driverService = new DriverService(driverRepository);
  const couponService = new CouponService(couponRepository);
  const rideService = new RideService(rideRepository, driverRepository, userRepository, undefined, undefined, undefined, couponService);
  const demoDataReady = seedDemoData(userService, driverService, rideService, couponService);

  // Initialize controllers
  const userController = new UserController(userService);
  const driverController = new DriverController(driverService);
  const rideController = new RideController(rideService, couponService);
  const couponController = new CouponController(couponService);

  app.use(async (_req, _res, next) => {
    await demoDataReady;
    next();
  });

  // Routes
  const router = createRouter(userController, driverController, rideController, couponController);
  app.use('/api', router);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
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

async function seedDemoData(
  userService: UserService,
  driverService: DriverService,
  rideService: RideService,
  couponService: CouponService
): Promise<void> {
  const [demoUser, secondUser] = await Promise.all([
    userService.registerUser('Alex Morgan', 'alex@example.com', '+91 98765 43210'),
    userService.registerUser('Priya Shah', 'priya@example.com', '+91 98765 43211'),
  ]);

  await Promise.all([
    driverService.registerDriver('Sam Taylor', 'sam@example.com', '+91 90000 00001', VehicleType.HATCHBACK, 'MH12AB1234', 'Honda City', 28.7041, 77.1025),
    driverService.registerDriver('Maya Singh', 'maya@example.com', '+91 90000 00002', VehicleType.SEDAN, 'DL01CD5678', 'Maruti Ciaz', 28.705, 77.103),
    driverService.registerDriver('Rohan Mehta', 'rohan@example.com', '+91 90000 00003', VehicleType.SEDAN, 'KA03EF9012', 'Honda Amaze', 28.706, 77.104),
  ]);

  await couponService.createCoupon('WELCOME20', 'PERCENTAGE', 20, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 100);
  await rideService.bookRide(demoUser.id, VehicleType.SEDAN, 28.7041, 77.1025, 28.7055, 77.104);
  void secondUser;
}
