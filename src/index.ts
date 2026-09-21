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
  const users: Array<[string, string, string]> = [
    ['Alex Morgan', 'alex@example.com', '+91 98765 43210'],
    ['Priya Shah', 'priya@example.com', '+91 98765 43211'],
    ['Kabir Mehta', 'kabir@example.com', '+91 98765 43212'],
    ['Isha Kapoor', 'isha@example.com', '+91 98765 43213'],
    ['Arjun Rao', 'arjun@example.com', '+91 98765 43214'],
    ['Neha Verma', 'neha@example.com', '+91 98765 43215'],
    ['Vikram Joshi', 'vikram@example.com', '+91 98765 43216'],
    ['Ananya Das', 'ananya@example.com', '+91 98765 43217'],
    ['Riya Nair', 'riya@example.com', '+91 98765 43218'],
    ['Aditya Sen', 'aditya@example.com', '+91 98765 43219'],
  ];
  const drivers: Array<[string, string, string, VehicleType, string, string, number, number]> = [
    ['Sam Taylor', 'sam@example.com', '+91 90000 00001', VehicleType.HATCHBACK, 'MH12AB1234', 'Honda City', 28.7041, 77.1025],
    ['Maya Singh', 'maya@example.com', '+91 90000 00002', VehicleType.SEDAN, 'DL01CD5678', 'Maruti Ciaz', 28.705, 77.103],
    ['Rohan Mehta', 'rohan@example.com', '+91 90000 00003', VehicleType.SEDAN, 'KA03EF9012', 'Honda Amaze', 28.706, 77.104],
    ['Tara Menon', 'tara@example.com', '+91 90000 00004', VehicleType.HATCHBACK, 'DL02GH3456', 'Hyundai Grand i10', 28.697, 77.109],
    ['Nikhil Batra', 'nikhil@example.com', '+91 90000 00005', VehicleType.SEDAN, 'DL03IJ7890', 'Honda City', 28.711, 77.098],
    ['Meera Iyer', 'meera@example.com', '+91 90000 00006', VehicleType.HATCHBACK, 'DL04KL1234', 'Tata Altroz', 28.698, 77.095],
    ['Dev Malhotra', 'dev@example.com', '+91 90000 00007', VehicleType.SEDAN, 'DL05MN5678', 'Skoda Slavia', 28.713, 77.107],
    ['Sana Khan', 'sana@example.com', '+91 90000 00008', VehicleType.HATCHBACK, 'DL06OP9012', 'Maruti Swift', 28.691, 77.101],
    ['Rahul Khanna', 'rahul@example.com', '+91 90000 00009', VehicleType.SEDAN, 'DL07QR3456', 'Toyota Etios', 28.716, 77.096],
    ['Pooja Sethi', 'pooja@example.com', '+91 90000 00010', VehicleType.HATCHBACK, 'DL08ST7890', 'Renault Kwid', 28.709, 77.112],
  ];

  const seededUsers = await Promise.all(
    users.map(([name, email, phone]) => userService.registerUser(name, email, phone))
  );
  await Promise.all(
    drivers.map(([name, email, phone, vehicleType, plate, model, latitude, longitude]) =>
      driverService.registerDriver(name, email, phone, vehicleType, plate, model, latitude, longitude)
    )
  );

  await couponService.createCoupon('WELCOME20', 'PERCENTAGE', 20, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 100);
  await rideService.bookRide(seededUsers[0].id, VehicleType.SEDAN, 28.7041, 77.1025, 28.7055, 77.104);
}
