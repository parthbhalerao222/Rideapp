# Drift

Drift is a ride operations app with a browser dashboard and a TypeScript/Express API. It supports rider and driver registration, location-aware ride booking, vehicle-aware pricing, ride completion, ride history, and coupons.

## Run locally

```bash
npm install
npm run build
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard can create riders and drivers, request rides, refresh network status, and complete active rides.

Data is held in memory and resets when the process restarts.

## Product flow

1. Add a rider and a driver from the dashboard.
2. Request a Hatchback or Sedan ride using the default coordinates.
3. Watch the driver move to `ON_RIDE` and the trip appear in activity.
4. Complete the trip to calculate distance and fare.
5. Refresh to see the driver available again and the completed fare.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service health |
| GET/POST | `/api/users` | List or register riders |
| GET | `/api/users/:userId` | Read a rider |
| GET/POST | `/api/drivers` | List or register drivers |
| GET | `/api/drivers/:driverId` | Read a driver |
| PATCH | `/api/drivers/:driverId/location` | Update driver location |
| POST | `/api/rides` | Book a ride |
| POST | `/api/rides/:rideId/end` | Complete a ride |
| POST | `/api/rides/:rideId/cancel` | Cancel an active ride |
| GET | `/api/users/:userId/rides` | Rider history |
| GET | `/api/drivers/:driverId/rides` | Driver history |
| POST/GET | `/api/coupons` | Create or read coupons |
| DELETE | `/api/coupons/:code` | Disable a coupon |

## Architecture

- `src/domain`: entities, value objects, enums, and repository contracts.
- `src/application`: use-case services, pricing strategies, and API DTOs.
- `src/infrastructure`: in-memory repository implementations.
- `src/presentation`: Express controllers and routes.
- `public`: the browser dashboard served by Express.

The dashboard uses the same API as external clients. Domain services remain independent of the browser and can be tested without starting a server.

## Business rules

- Search radius defaults to 5 km.
- Distance uses the Haversine formula.
- Minimum fare is ₹50.
- Hatchback rates are ₹10/km for the first 2 km, ₹8/km from 2–5 km, and ₹5/km beyond 5 km.
- Sedan rates are ₹15/km for the first 2 km, ₹12/km from 2–5 km, and ₹8/km beyond 5 km.
- A Hatchback request may be upgraded to a Sedan when no Hatchback is available nearby; the rider pays Hatchback pricing.
- Coupons support percentage and flat discounts, expiry, deletion, and optional percentage caps.
- Driver matching supports nearest and highest-rated strategies.
- Surge pricing is policy-based and can be enabled without changing base pricing.
- Active rides can be cancelled with a 10% cancellation fee.
- Driver assignment has an in-process reservation guard for concurrent requests.

## Development
