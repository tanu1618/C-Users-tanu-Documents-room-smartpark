# SmartPark — Smart Parking Management System

A working demo of a **location-independent** parking management system built as a
**DBMS mini project**.

A *location* is any place that offers parking — a **shopping mall, college/university,
hospital, office/business complex, hotel or public parking area** — and all of them run on
the same tables, distinguished only by `locations.location_type`. Visitors pick a location
type, a location and one of its parking areas, see live slot availability, pick a free
**Car / Bike / EV** slot, book it with their vehicle details and get a booking ID.
Facility staff get a **separate admin login** with a dashboard to watch occupancy, change
slot statuses and manage bookings. Every screen reads and writes the same seven relational
tables, so a booking made by a visitor shows up in the admin console immediately.

No QR scanners, cameras, sensors, GPS or IoT hardware are used — everything runs on
database/demo data on a single laptop. (Those ideas are listed under *Future scope*.)

---

## 1. How to run it

Pick any one — there is nothing to install.

| Option | Command / action | Notes |
| --- | --- | --- |
| Simplest | double-click **`index.html`** | Works offline, straight from the folder |
| Local web server | `node serve.js` → <http://127.0.0.1:8123/> | Dependency-free static server |
| Single portable file | `node build-standalone.js` → open **`standalone.html`** | Optional. Bundles the CSS + JS into one file (needs a writable folder) — handy on a USB stick |

Works in Chrome, Edge, Firefox and Safari. Data is kept in the browser's
`localStorage`, so bookings survive a page reload and the demo can be run without a
server. **Admin → Reset demo data** restores the original seeded rows at any time
(useful right before a viva/demonstration).

---

## 2. Demo credentials

There is no signup: visitors book a slot by entering their name and vehicle number, and
SmartPark matches or creates their **Users** row automatically (switch users on the
My Bookings page).

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@smartpark.in` | `admin123` |
| Facility Manager | `manager@smartpark.in` | `manager123` |

The login page has a **Fill demo credentials** button.

---

## 3. Live demo script (about 3 minutes)

1. **Home** — show the live slot map and the counters (155 slots / 6 locations).
2. **Find Parking** — the six location types are listed; pick **College / University**
   (or search “hospital”, “Mumbai”, “Basement”).
3. **Select Location** — open **ABC College – Main Parking**.
4. **Select Parking Area** — choose *Main Gate Ground Parking* (or *Staff & Visitor Parking*).
5. **Parking Availability** — point out the colour legend: green available, red occupied,
   amber reserved, grey maintenance. `A01 Available`, `A02 Occupied`, `A04 Reserved`.
6. Click **A02 (red)** — the slot page opens read-only: *“This slot is Occupied …
   SmartPark will not allow a new booking on it.”* (proof of the business rule).
7. Click **A03 (green)** → **Book this slot**. Try to break it: short phone number,
   vehicle number `12345`, and the EV/Bike type — validation blocks each one.
8. Fix the details, choose 4 hours and **Confirm booking**. A booking ID such as
   `BK-1039` is generated, the slot turns amber, and the receipt shows a mini area map.
9. **My Bookings** — the booking is listed with its location, type and parking area;
   cancel it and the slot goes back to available.
10. Now sign in as **Admin** → the dashboard already shows the new booking with a
    **NEW** badge, the occupancy bars per location *and* per parking area, and the
    “all six location types on one schema” summary.
11. **Slot Management** — filter by **location** and **parking area**, then change a slot
    to *Maintenance*; try to close an occupied slot and it refuses (a parked vehicle must
    be checked out first).
12. **Booking Management** — filter by location, **Check in** a reserved booking (slot
    becomes occupied), **Complete** it (slot becomes available again), or cancel it.
13. **Database Schema** (`#/schema`) — the seven tables with PK/FK/UNIQUE/CHECK markers,
    the relationship diagram, the `CREATE TABLE` script, the SQL queries behind the screens
    (including “free slots by location type”), and a one-click **integrity check**.

---

## 4. Pages

| # | Page | Route |
| --- | --- | --- |
| 1 | Home | `#/` |
| 2 | Find Parking (choose location type) | `#/find` |
| 3 | Locations of that type | `#/locations?type=Hospital` |
| 4 | Location detail (parking areas) | `#/location/L03` |
| 5 | Parking Availability (area + slot grid) | `#/availability?location=L03&area=PA05` |
| 6 | Slot Details | `#/slot/A01` |
| 7 | Booking (vehicle details form) | `#/book/A01` |
| 8 | Booking Confirmation / receipt | `#/confirmation/BK-1039` |
| 9 | My Bookings | `#/bookings` |
| 10 | Admin Login | `#/admin/login` |
| 11 | Admin Dashboard | `#/admin` |
| 12 | Slot Management | `#/admin/slots` |
| 13 | Booking Management | `#/admin/bookings` |
| — | Database schema & SQL (bonus) | `#/schema` |

---

## 5. Database design

Seven tables (see `#/schema` for the live version):

```
locations (1) ──< parking_areas (1) ──< parking_slots
users (1) ──< vehicles (1) ──< bookings >── (1) parking_slots
users (1) ──< bookings >── (1) vehicles
admins (n) ──> (1) locations             -- each admin manages one location
```

| Table | Primary key | Foreign keys | Notes |
| --- | --- | --- | --- |
| `users` | `user_id` | — | name, email (unique), phone (unique), password |
| `admins` | `admin_id` | `location_id → locations` | role (Super Admin / Facility Manager) |
| `locations` | `location_id` | — | **location_type** (mall / college / hospital / office / hotel / public), city, address, opening hours |
| `parking_areas` | `area_id` | `location_id → locations` | one floor / block / zone of a location |
| `parking_slots` | `slot_id` | `area_id → parking_areas` | `slot_code` unique, type, zone, status, hourly rate |
| `vehicles` | `vehicle_id` | `user_id → users` | `vehicle_number` unique, Car/Bike/EV |
| `bookings` | `booking_id` | `user_id`, `vehicle_id`, `slot_id` | start/end time, duration, amount, status |

Constraints enforced by the data layer (`js/db.js`):

* **PRIMARY KEY** uniqueness on every table.
* **FOREIGN KEY** checks on insert *and* update.
* **UNIQUE** keys: `users.email`, `users.phone`, `parking_slots.slot_code`,
  `vehicles.vehicle_number`, `locations`/`areas`/`bookings` keys.
* **CHECK** constraints: `slot_type IN ('Car','Bike','EV')`,
  `status IN ('available','occupied','reserved','maintenance')`,
  `bookings.status IN ('upcoming','active','completed','cancelled')`, `duration_hours > 0`,
  and `location_type IN ('Shopping Mall','College / University','Hospital',
  'Office / Business Complex','Hotel','Public Parking Area')`.
* **RESTRICT** on delete — deleting a location that still has parking areas is refused.
* **Business rules**: a slot that is `occupied` / `reserved` / `maintenance` cannot be
  booked; the vehicle type must match the slot zone; a slot cannot be closed for
  maintenance while a vehicle is parked in it; a slot always has at most one live booking.

Booking creation is **all-or-nothing**: `createBooking()` snapshots the database, performs
the inserts/updates and rolls back completely if any step fails, so a slot can never be
double-booked. The **Integrity check** button re-validates PKs, FKs, unique keys and the
slot-status ↔ booking-status consistency rule.

---

## 6. Demo data

| Table | Rows |
| --- | --- |
| locations | 6 — one per supported type |
| parking_areas | 12 — 2 per location |
| parking_slots | 155 — Car + Bike + EV zones, 93 available on a fresh seed |
| users | 10 |
| vehicles | 69 |
| bookings | 69 — a mix of upcoming, active, completed and cancelled |

| Location ID | Name | Type | City |
| --- | --- | --- | --- |
| `L01` | ABC College – Main Parking | College / University | Pune |
| `L02` | City Center Mall – Basement Parking | Shopping Mall | Pune |
| `L03` | City Hospital – Visitor Parking | Hospital | Pune |
| `L04` | TechPark Office – Employee Parking | Office / Business Complex | Bengaluru |
| `L05` | Grand Hotel – Guest Parking | Hotel | Mumbai |
| `L06` | Central Market – Public Parking | Public Parking Area | Delhi |

Each location has two parking areas (e.g. `L03` → *Visitor Ground Parking* + *Emergency &
Ambulance Bay*), with one slot in a demo-friendly state: `A01` available, `A02` occupied,
`A04` reserved.

Adding a new location — of an existing type or a brand-new one — is a data change, not a
code change: insert a `locations` row, its `parking_areas`, and let the app's slot map pick
them up.

All names, phone numbers, registration numbers and bookings are **fictional** and were
created for this demo only.

---

## 7. Project structure

```
smartpark/
├── index.html             # shell: mounts the router, modals and toasts
├── css/styles.css         # design system (mobility theme, slot colours, responsive)
├── js/db.js              # the "database": schema, seed data, constraints, queries, transactions
├── js/app.js             # router, nav/footer, toasts, modals, visitor pages + booking flow
├── js/admin.js           # admin login, dashboard, slot management, booking management
├── serve.js              # optional dependency-free static server
├── build-standalone.js   # optional: bundle everything into standalone.html
└── README.md
```

## 8. Future scope (not implemented)

* QR-code check-in / check-out at the boom barrier.
* ANPR (number-plate recognition) camera entry.
* IoT occupancy sensors reporting slot status automatically.
* Live GPS and in-location navigation to the reserved slot.
* Payments, monthly passes and multi-city administration.
