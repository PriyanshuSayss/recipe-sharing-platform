# Plateful — Full-Stack Recipe Sharing and Scaling Platform

Plateful is a production-grade, hiring-ready recipe sharing platform engineered with strict data integrity, mathematical precision serving-size scaling, deterministic pantry matching ("What Can I Cook?"), secure media uploads, and community reviews.

---

## 1. Project Overview

Plateful empowers home cooks and culinary enthusiasts to discover, create, and adapt recipes to any party size. Unlike generic recipe apps, Plateful emphasizes:
- **Serving-Size Scaling Without Drift**: Pure functional recalculations from original recipe quantities that avoid cumulative IEEE-754 floating-point errors.
- **Pantry / Kitchen Matching**: Real database matching and ranking that surfaces both matching and missing ingredients.
- **Enterprise-Grade Security & Authorization**: Argon2id password hashing, HttpOnly cookies, server-side ownership verification, magic-byte file signature validation, and database-level review uniqueness.

---

## 2. Key Implemented Features

### 🍽 Recipe Creation & Management
- Structured ingredient builder: quantity, supported culinary unit, and ingredient name.
- Dynamic addition and removal of ingredient rows and numbered cooking instructions.
- Recipe photograph uploads with server-side validation (magic bytes, MIME type, Sharp re-encoding, size limits).
- Full CRUD operations with author-only edit and delete authorization.
- "My Recipes" management dashboard with confirmation modals.
- Friendly, human-readable SEO slugs (e.g. `/recipes/classic-pancakes`).

### 🔍 Discovery, Search & Filtering
- Instant debounced search querying recipe titles and tags.
- Tag/category filtering (`breakfast`, `dinner`, `vegan`, `quick`, `pasta`, `dessert`, etc.).
- Paginated results with loading, error, and empty state handling.
- Card metrics displaying prep time, author, original servings, and dynamic average star ratings.

### 🍳 "What Can I Cook?" Kitchen Search
- Multi-ingredient input with case-normalization, whitespace trimming, and duplicate removal.
- Deterministic regex and normalized token matching against stored ingredients.
- Ranked recipe output displaying:
  - Exact matched ingredients
  - Missing ingredients required to finish the dish
  - Match percentage score

### ⚖️ Serving-Size Scaling Engine (Core Assessment Requirement)
- Pure functional scaling formula:
  $$\text{newQuantity} = \text{originalQuantity} \times \left(\frac{\text{newServings}}{\text{originalServings}}\right)$$
- Always calculates from original persisted values — zero drift across repeated adjustments.
- Strips redundant trailing zeros (`3.000` $\rightarrow$ `3`, `1.500` $\rightarrow$ `1.5`).
- Preserves the original units for every ingredient.
- Validates positive finite integers for servings ($1 \le n \le 10,000$).
- Backed by an independent automated unit test suite.

### ⭐ Ratings & Reviews
- Integer ratings from 1 to 5 with optional written feedback (up to 2,000 characters).
- Enforced single-review-per-user-per-recipe policy backed by a compound unique database index `{ recipe: 1, user: 1 }`.
- Concurrent-safe upsert behavior (`findOneAndUpdate` with `upsert: true`).
- Server-side MongoDB aggregation pipelines to calculate average ratings and review counts on the fly.

### 🛡️ File & Media Upload Pipeline
- Accepts JPEG, PNG, and WebP up to 5 MB.
- Inspects binary file signatures (magic bytes) to defeat spoofed MIME types.
- Re-encodes uploaded files through `sharp` to strip malicious payloads or embedded scripts.
- Stores files with UUID identifiers in protected local directories with path traversal safeguards.

### 🔖 Stretch Feature 1: Saved Recipes & Collections
- Authenticated users can bookmark recipes to their personal saved collection with a single click.
- Database-level compound unique index on `{ user: 1, recipe: 1 }` prevents duplicate saves.
- Dedicated `/saved-recipes` collection dashboard with instant remove/unsave actions.

### 🛒 Stretch Feature 2: Aggregated Multi-Recipe Shopping List
- Users can add multiple recipes to their shopping list directly from recipe pages with custom serving sizes.
- **Unit Compatibility Arithmetic Engine**: Automatically sums quantities for identical normalized ingredients with compatible units (e.g. 2 cups flour + 1 cup flour = 3 cups flour).
- **Incompatible Unit Protection**: Never sums incompatible units together (e.g. 200g sugar vs 1 cup sugar are kept as distinct, labeled line items).
- Interactive checklist to cross off acquired items in the supermarket.
- One-click print stylesheet support (`window.print()`) and mobile-friendly responsive layout.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript (Strict mode)
- **Tooling**: Vite 5
- **Styling**: Tailwind CSS (Warm cream `#FFFBEB`, Forest Green `#1A5C38`, Coral `#F97316`)
- **State Management**: TanStack React Query v5 (server-state caching and invalidation)
- **Forms & Validation**: React Hook Form with Zod resolvers
- **Routing**: React Router v6
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js LTS (v24 compatible)
- **Framework**: Express with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT stored in secure `HttpOnly` cookies, Argon2id password hashing
- **Security**: Helmet, Express Rate Limit, CORS with explicit origin allowlist
- **Media Processing**: Multer + Sharp
- **Testing**: Vitest, Supertest, MongoMemoryServer for isolated in-memory testing

---

## 4. Architecture & Request Data Flow

Plateful follows a clean layered architecture:

```
[ Browser / Client (Vite + React) ]
            │
            │ HTTP / JSON / Cookies / Multipart
            ▼
[ Express Application Layer ]
    ├── Security Middlewares (Helmet, CORS, RateLimit, CookieParser)
    ├── Authentication Middleware (requireAuth, optionalAuth via JWT)
    ├── Validation Middleware (Zod schema parser)
    └── Route Handlers / Controllers
            │
            ▼
[ Domain Services & Pure Utilities ]
    ├── Scaling Engine (server/src/utils/scaling.ts)
    ├── Slug Generator (server/src/utils/slug.ts)
    └── Image Processor (Sharp re-encoding pipeline)
            │
            ▼
[ Persistence Layer (Mongoose & MongoDB) ]
    ├── User Collection (Argon2id hashes, email indexes)
    ├── Recipe Collection (Compound indexes, text/tags indexes)
    └── Review Collection (Unique compound index on recipe + user)
```

---

## 5. Database Models & Schema Design

### User Model (`User.ts`)
| Field | Type | Rules & Indexes |
|---|---|---|
| `displayName` | String | 2–60 chars, trimmed |
| `email` | String | Lowercase, unique index, regex validation |
| `passwordHash` | String | Argon2id hash, `select: false` (never leaked in API) |
| `timestamps` | Date | `createdAt`, `updatedAt` |

### Recipe Model (`Recipe.ts`)
| Field | Type | Rules & Indexes |
|---|---|---|
| `title` | String | 3–200 chars, trimmed |
| `slug` | String | Unique index, URL safe |
| `description` | String | Up to 5,000 chars |
| `author` | ObjectId | Ref: `User`, indexed |
| `imageUrl` | String | URL to stored asset |
| `originalServings` | Number | Integer, $1 \le n \le 1,000$ |
| `cookingTimeMinutes` | Number | Positive integer |
| `tags` | [String] | Indexed for tag filters |
| `ingredients` | [Ingredient] | Structured subdocument: `{ name, normalizedName, quantity, unit }` |
| `instructions` | [Instruction] | Structured subdocument: `{ stepNumber, text }` |
| `timestamps` | Date | `createdAt`, `updatedAt` |

### Review Model (`Review.ts`)
| Field | Type | Rules & Indexes |
|---|---|---|
| `recipe` | ObjectId | Ref: `Recipe`, indexed |
| `user` | ObjectId | Ref: `User` |
| `rating` | Number | Integer $1 \le n \le 5$ |
| `text` | String | Up to 2,000 chars |
| **Unique Compound Index** | `{ recipe: 1, user: 1 }` | **Guarantees max 1 review per user per recipe** |

---

## 6. Key Engineering Decisions & Trade-Offs

1. **Pure Serving Scaling vs. Mutation**:
   - *Decision*: Recalculate on-the-fly both on client and server from saved base quantities.
   - *Trade-off*: Slightly more render-time arithmetic in exchange for mathematically guaranteed idempotency and complete immunity to floating-point drift.
2. **Review Aggregation via Aggregation Pipeline**:
   - *Decision*: Calculate `averageRating` and `reviewCount` dynamically from the reviews collection.
   - *Trade-off*: Eliminates data de-synchronization risks that occur when storing denormalized counters on the recipe document.
3. **Database-Level Unique Constraints for Reviews**:
   - *Decision*: Enforce `{ recipe: 1, user: 1 }` compound unique index in MongoDB.
   - *Trade-off*: Prevents race conditions from concurrent browser requests that application-level checks fail to stop.
4. **Binary Magic-Byte Inspection for Uploads**:
   - *Decision*: Reject uploads whose byte signatures don't match JPEG, PNG, or WebP magic bytes, then re-encode with Sharp.
   - *Trade-off*: Consumes minor CPU during upload to completely eliminate file-extension spoofing and polyglot executable attacks.

---

## 7. Prerequisites

- **Node.js**: v18.0.0 or higher (tested on v24.5.0)
- **npm**: v9.0.0 or higher (tested on v11.5.1)
- **MongoDB**: Local MongoDB daemon or free MongoDB Atlas URI

---

## 8. Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PriyanshuSayss/recipe-sharing-platform.git
   cd recipe-sharing-platform
   ```

2. **Install all monorepo dependencies**:
   ```bash
   npm install --workspace=server
   npm install --workspace=client
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `server/.env`:
   ```bash
   cp .env.example server/.env
   ```
   Edit `server/.env` if you have custom MongoDB credentials or ports.

4. **Seed Database with Demonstration Data**:
   Ensure MongoDB is running, then execute:
   ```bash
   npm run seed --workspace=server
   ```

5. **Start Development Servers**:
   Run concurrently from root:
   ```bash
   npm run dev
   ```
   Or separately:
   - Backend: `cd server && npm run dev` (runs on `http://localhost:5000`)
   - Frontend: `cd client && npm run dev` (runs on `http://localhost:5173`)

---

## 9. Demo Account Credentials

The seed script creates the following demo accounts:

| Email | Password | Role |
|---|---|---|
| `alice@plateful.dev` | `Demo1234!` | Demo Author & Reviewer |
| `bob@plateful.dev` | `Demo1234!` | Demo Author & Reviewer |

*(Demo accounts are for evaluation and testing only. Passwords are never committed in plaintext.)*

---

## 10. API Documentation

### Auth Endpoints
- `POST /api/auth/register` — Create a new account (`displayName`, `email`, `password`)
- `POST /api/auth/login` — Sign in and receive HttpOnly cookie session
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Retrieve current authenticated profile

### Recipe Endpoints
- `GET /api/recipes` — List recipes with optional `?q=`, `?tag=`, `?page=`, `?limit=`
- `GET /api/recipes/:slug` — Retrieve single recipe by unique slug
- `POST /api/recipes` — Create a recipe (Authenticated)
- `PATCH /api/recipes/:id` — Update owned recipe (Author only)
- `DELETE /api/recipes/:id` — Delete owned recipe (Author only)
- `GET /api/recipes/mine` — List authenticated user's recipes
- `POST /api/recipes/search/ingredients` — Match kitchen ingredients and rank recipes

### Review Endpoints
- `GET /api/recipes/:id/reviews` — Fetch reviews and aggregate rating summary
- `PUT /api/recipes/:id/review` — Upsert rating and review (Authenticated)
- `DELETE /api/recipes/:id/review` — Delete user's review (Authenticated)

### Collections (Saved Recipes) Endpoints
- `GET /api/recipes/saved` — List authenticated user's bookmarked recipes
- `POST /api/recipes/:id/save` — Save recipe to collection
- `DELETE /api/recipes/:id/save` — Remove recipe from collection
- `GET /api/recipes/:id/is-saved` — Check if recipe is saved by current user

### Shopping List Endpoints
- `POST /api/shopping-list/aggregate` — Aggregate ingredients across multiple recipes with serving scaling and unit compatibility logic

### Media Uploads
- `POST /api/uploads/recipe-image` — Multipart form upload (`image` field, max 5MB, JPEG/PNG/WebP)

---

## 11. Automated Test Suite

Plateful features an automated test suite with **71 passing test cases** across unit and integration suites using `Vitest`, `Supertest`, and an isolated in-memory MongoDB environment (`mongodb-memory-server`):

```bash
npm run test --workspace=server
```

### Verified Test Coverage Highlights:
- **Serving Scaling**: Two-to-three servings, downward scaling, floating-point drift prevention, zero/negative rejection, non-finite values, and fraction conversions (31 unit tests).
- **Shopping List Unit Logic**: Plural/singular normalization, identical unit summation, and strict separation of incompatible units without silent arithmetic errors (7 unit tests).
- **Recipe Management & Pantry Discovery**: Valid creation, validation failures, unauthorized edits, title and tag searches, ingredient matching, and missing ingredient computation (16 integration tests).
- **Reviews & Ratings**: Review creation, in-place updates, rate limit safety, average rating calculation across multiple users, and database-level unique index enforcement (6 integration tests).
- **Upload Security**: Non-authenticated rejection, invalid file signature rejection, HTML/executable masquerading rejection, and oversized (>5MB) rejection (4 integration tests).
- **Stretch Collections & Shopping Endpoints**: Bookmark toggle, duplicate save prevention, collection listing, and multi-recipe shopping list aggregation (7 integration tests).

---

## 12. Production Build

To verify compilation and generate production assets:

```bash
# Build both frontend and backend
npm run build
```

- Backend outputs to `server/dist/`
- Frontend bundle outputs to `client/dist/`

---

## 13. Deployment Guide

### Backend (e.g. Render, Railway, or Fly.io)
1. Set root directory to `server`.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=<your_mongodb_atlas_uri>`
   - `JWT_SECRET=<strong_random_32_char_secret>`
   - `CLIENT_ORIGIN=https://<your_frontend_domain>`
   - `COOKIE_SECURE=true`

### Frontend (e.g. Vercel, Netlify)
1. Set root directory to `client`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Configure reverse proxy / redirect rules for `/api/*` to point to your live backend domain.

---

## 14. Video Walkthrough Outline

The step-by-step video outline for recording the 3–5 minute demonstration is available in [`docs/demo-script.md`](file:///c:/Users/MY/Desktop/recipe/docs/demo-script.md).

---

## 15. AI Transparency Notice

In accordance with hiring assessment guidelines:
- **AI Agent**: Antigravity (Powered by Claude / Gemini)
- **Role**: Pair programmer and implementation assistant.
- **Scope**: Used for scaffold generation, automated test drafting, and refactoring validation patterns. All business logic, mathematical precision algorithms, security boundaries, and test assertions were strictly validated and verified against the assessment rubric.
