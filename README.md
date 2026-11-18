# Lab Test Booking — Bengaluru

A live diagnostic-laboratory booking console for a single laboratory in **Bengaluru**, built with **React 18 + Vite**.
It is **admin-only**: laboratory administrators sign in, build a cart, book a slot, and **reschedule or cancel** bookings.
Patients never sign in. No branch, street or locality names appear anywhere — only the city, Bengaluru.

## Quick start
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm test           # Vitest: catalogue, pricing, booking rules, validation, auth, lab data
```
Node.js 20+ required. No environment variables are needed. **Front-end only:** there is no server; everything is stored in the browser.

### First run
1. Open the app, click **Lab admin login**, then **Set up the first admin account** (`/setup`). Available only until the first admin exists.
2. Open **Profile** to add other lab admins (a temporary password is generated; they choose their own at first sign-in).
3. Open the **Test Catalogue**, add to the cart, enter the patient, choose a slot, review the price and confirm.
4. Use **Bookings** to reschedule, cancel or print a pass.

## Who can do what
| | Visitor | Lab admin |
|---|---|---|
| Browse tests, packages and prices | ✔ | ✔ |
| Sign in | – | ✔ (only admins have accounts) |
| Add/remove lab admins, reset passwords | ✘ | ✔ |
| **Book** (cart → patient → slot → review) | ✘ | ✔ |
| **Reschedule / cancel** a booking | ✘ | ✔ |

Rules are enforced in the service layer (`bookingService.js`, `authService.js`), not only hidden in the UI. Older saves that
contain patient accounts are ignored: those accounts cannot sign in and are never listed.

## Pricing (cart, review, booking details, pass)
* Each test/package has a price and an MRP; the cart shows **Total MRP → Discount → Total payable**.
* **Lab visit is free.** **Home collection** is free on orders of ₹500 or more, otherwise ₹150 (`src/utils/priceUtils.js`).
* The booking stores `mrpTotal`, `subtotal`, `collectionFee` and `total`.
* Home collection is accepted for Bengaluru PIN codes only (560001 – 560103).

## Reschedule and cancel
Both live on **Bookings** (list and details) and need an admin session. They are open while the booking is **Confirmed** and the
slot has not started (not after check-in). Rescheduling checks live seat availability and swaps seats in one write; cancelling asks
for a reason, releases the seat immediately and records the reason in the booking history.

## The laboratory
`src/data/laboratories.js` holds the single lab (name, phone, email, hours, slot capacity). Edit it with your real details; it
intentionally has no address or area fields.

## Pages
| Route | Access | Purpose |
|---|---|---|
| `/` | everyone | Dashboard: 50/50 hero (text + lab photo), KPIs (seeded demo data), lab info, categories, packages, FAQ |
| `/tests`, `/tests/:id` | everyone | Test Catalogue (horizontal filter bar),  parameters, 3D specimen tube. Admins can add to the cart |
| `/login`, `/setup` | visitors | 3D sign-in; one-time first-admin setup |
| `/cart` → `/patient` → `/schedule` → `/review` → `/confirmation/:ref` | admin | Booking pipeline with price summary and printable pass |
| `/bookings`, `/bookings/:id` | admin | All bookings, live tracker, **reschedule & cancel** |
| `/account` | admin | The single Profile page: own details, change password, and the lab admin team (add, reset, remove) |

## Real-time sync
`storageService.js` persists to `localStorage` and broadcasts every write through the BroadcastChannel API (with the `storage` event as
fallback). `useBookings()` exposes a cached snapshot through `useSyncExternalStore`, so every open tab updates. Seat counts are derived
(`baseline load + non-cancelled bookings`), so cancelling or rescheduling frees a seat everywhere.

## Security notes
There is no server: accounts live in the browser's `localStorage`, passwords are stored only as salted PBKDF2-SHA-256 hashes (sign-in requires https or localhost, because Web Crypto is unavailable on plain http), sign-ins
lock for 60 s after 5 failures, and sessions expire. This suits a front-end project; **production needs a real backend**
(authentication API, server-side authorisation, audit log).

## Design & motion
Dark teal (dashboard) and deep-blue (test catalogue) hero panels built from pure CSS gradients, rounded white cards and bold headings
(Plus Jakarta Sans). The dashboard hero is a flexbox split: the text column and the lab photo are each 50% wide on tablets and up, and
stack on phones. React Three Fiber is used only for the specimen tube (test details) and the sign-in DNA helix; both are lazy-loaded,
respect `prefers-reduced-motion`, and fall back to SVG/CSS without WebGL.

## Performance
The dashboard and test catalogue load up front. Every other page (cart, patient, schedule, review, bookings, account, sign-in) is
code-split and loads on demand.

## Demo data
The first visit seeds 20 sample bookings so the dashboard KPIs and chart have something to show. They are demo data, not real activity.

## Stack
React 18 · Vite · Tailwind CSS · React Router 6 · Framer Motion · Three.js + React Three Fiber · Recharts · Lucide · React Hook Form + Zod · date-fns
