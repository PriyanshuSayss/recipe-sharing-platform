# Plateful — Demonstration Video Script & Walkthrough Outline
**Target Duration:** 3–5 minutes  
**Format:** Screen recording with voiceover explanation  

---

### Step 1: Introduction & Architecture Overview (0:00 – 0:30)
- **Visual:** Plateful Homepage (`http://localhost:5173`)
- **Key Talking Points:**
  - Introduce **Plateful**: a full-stack recipe sharing, kitchen discovery, and serving-scaling platform built for real-world cooking.
  - Quick mention of stack: React + TypeScript + Vite + Tailwind CSS on the frontend; Express + TypeScript + MongoDB/Mongoose on the backend.
  - Point out clean, food-publication design aesthetic (warm backgrounds, forest green brand colors, coral accents).

---

### Step 2: Recipe Discovery, Search & Filtering (0:30 – 1:00)
- **Visual:** Interacting with search bar and tag filters on homepage.
- **Key Actions & Talking Points:**
  - Type in search terms (e.g., "pancake", "pasta") to show real-time debounced query to backend database.
  - Click tags (e.g., "breakfast", "vegan", "quick") to filter recipes using indexed tag queries.
  - Demonstrate card metadata: prep time, original servings, and dynamic average star ratings.

---

### Step 3: "What Can I Cook?" Kitchen Search (1:00 – 1:45)
- **Visual:** Navigate to `/kitchen-search`.
- **Key Actions & Talking Points:**
  - Input available pantry ingredients one by one (e.g., `eggs`, `bacon`).
  - Show input validation, chip removal, and deduplication.
  - Execute search: display ranked recipe results (e.g., *Pasta Carbonara*).
  - Highlight the breakdown: **matched ingredients** vs **missing ingredients** and the computed match percentage.
  - Emphasize deterministic, reliable matching logic without mock or fake behavior.

---

### Step 4: Recipe Details & Serving-Size Scaling (1:45 – 2:30)
- **Visual:** Open a recipe detail page (e.g., *Classic Pancakes* or *Spaghetti Carbonara*).
- **Key Actions & Talking Points:**
  - Highlight recipe metadata: author, tags, structured ingredient list, and step-by-step instructions.
  - **Critical Requirement - Scaling Engine**:
    - Original recipe serves 4.
    - Scale up to 6 servings, then 8, then down to 2.
    - Show instantaneous, clean recalculation of every ingredient quantity with proper units preserved.
    - Explain mathematical principle: calculations are purely functional and always derive from the original persisted values (`newQuantity = originalQuantity × (newServings / originalServings)`), completely eliminating cumulative IEEE-754 floating-point drift.

---

### Step 5: User Authentication & Recipe Creation/Upload (2:30 – 3:30)
- **Visual:** Sign in via `/login` using demo account (`alice@plateful.dev` / `Demo1234!`) or create a new user.
- **Key Actions & Talking Points:**
  - Mention secure HttpOnly cookie authentication backed by Argon2id password hashing.
  - Go to **New Recipe** (`/recipes/new`).
  - Demonstrate structured ingredient builder: dynamic row additions/removals with strict unit and positive quantity validation.
  - Demonstrate dynamic step editor.
  - Demonstrate image upload: server verifies file signature (magic bytes), re-encodes via Sharp, enforces file size limits, and protects against path traversal.
  - Save and navigate to the newly generated URL slug.
  - Visit `/my-recipes` to view personal recipes and demonstrate ownership authorization controls.

---

### Step 6: Ratings & Reviews with Database Uniqueness (3:30 – 4:15)
- **Visual:** Review form on recipe detail page.
- **Key Actions & Talking Points:**
  - Submit an initial rating (e.g., 5 stars) and review comment.
  - Show that submitting again with a different score (e.g., 4 stars) cleanly updates the existing review rather than creating a duplicate.
  - Point to backend architecture: compound unique index `{ recipe: 1, user: 1 }` enforced at the database level prevents race conditions and duplicates.
  - Show aggregated average star rating and review count updating automatically.

---

### Step 7: Architecture, Code Highlights & Automated Test Suite (4:15 – 5:00)
- **Visual:** VS Code / Terminal with passing Vitest test suite (`npm run test`).
- **Key Code & Architecture Highlights:**
  - Show `server/src/utils/scaling.ts` (pure scaling utility with rounding and unit preservation).
  - Show Mongoose schemas with compound indexes (`Review`, `Recipe`).
  - Run `npm run test` in terminal showing the passing test suite covering unit scaling tests, auth, CRUD, search, reviews, and security limits.
- **Wrap-up:** Thank the viewer and conclude.
