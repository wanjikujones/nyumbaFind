# nyumbaFind 🏠

A single-page website that eases house hunting in Nairobi. Caretakers/landlords
list vacant houses (photos, price, size, area, contact), and hunters filter by
price, size and area, then chat directly with the caretaker on WhatsApp.

## Project structure

```
nyumbaFind/
├── index.html          # Single page: top/centre/bottom sections + modals
├── css/
│   └── style.css        # Layout, light & dark themes
├── js/
│   ├── data.js           # Nairobi constituencies & wards (for area dropdown)
│   └── app.js             # All app logic (dark mode, filters, uploads, storage)
└── README.md
```

## Before you launch — set your email

Open `index.html` and replace the placeholder email/name in two spots:
- The `<footer>` section near the bottom
- The `#aboutModal` section

Search for `youremail@example.com` and `[Your Name Here]`.

## Running locally (VS Code)

No build step needed — it's plain HTML/CSS/JS.

1. Open the folder in VS Code.
2. Install the **Live Server** extension (or any static server).
3. Right-click `index.html` → "Open with Live Server".

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → New Project → Import the repo.
3. Framework preset: **Other** (it's a static site, no build command needed).
4. Output directory: leave as root (`.`), since `index.html` sits at the top level.
5. Deploy — Vercel will give you a live `.vercel.app` URL.

Alternatively, from the CLI inside the project folder:
```
npm install -g vercel
vercel
```

## Backend: Supabase setup (do this before deploying)

Listings and images are now stored in **Supabase** (Postgres + Storage),
so every visitor sees the same live data — not just localStorage on one
browser. Set it up like this:

### 1. Create the project
Go to [supabase.com](https://supabase.com) → New project. Wait ~2 minutes
for it to spin up.

### 2. Run the database schema
Dashboard → **SQL Editor** → New query → paste in the entire contents of
`supabase/schema.sql` from this repo → **Run**.

This creates the `listings` table, and sets up Row Level Security so that:
- Anyone can read listings (public house-hunters)
- Anyone can create a listing (no login needed, per the spec)
- Anyone can delete a listing **only if it's already older than 3 weeks**
  (this is how expiry gets enforced, safely — a listing that isn't expired
  can never be deleted by this policy, no matter what)
- A database trigger blocks any new insert once there are already 30
  active listings, so the 30-cap can't be bypassed by editing the frontend

### 3. Create the storage bucket for photos
Dashboard → **Storage** → New bucket:
- Name: `listing-images`
- Public bucket: **ON** (so photos can be displayed without extra auth)

The schema file's last section also adds the policy that lets anonymous
caretakers upload into this bucket — that's already been applied when you
ran step 2.

### 4. Connect the frontend
Dashboard → **Project Settings → API**. Copy your **Project URL** and
**anon public key**, then paste them into `js/supabaseClient.js`:

```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi...";   // the public "anon" key
```

The anon key is *meant* to be public — it's safe to commit, because the
Row Level Security policies from step 2 are what actually control what it
can do. **Never** use the "service_role" key in frontend code.

### 5. (Optional, extra robustness) Server-side auto-purge
The frontend already self-cleans expired listings every time someone
loads the page (via the delete policy above). If you also want listings
to disappear even when nobody is visiting the site, enable a cron job:

Dashboard → **Database → Extensions** → toggle on `pg_cron`, then in the
SQL Editor run the two commented-out lines at the bottom of
`supabase/schema.sql` (uncomment them first).

### That's it — test it
Open `index.html` locally (Live Server), list a property, and refresh —
the listing should now persist and would show up for anyone else visiting
the same URL too, since it's coming from Supabase, not your browser.

## Feature checklist (matches the spec)

- [x] Single page, 3 sections: top / centre / bottom
- [x] Top-left: site name. Top-right: Dark mode toggle, About, List Property
- [x] Dark mode toggle switches the whole site's theme
- [x] About modal explains the site + developer email
- [x] List Property modal: up to 5 photos, price, size (Single–3 Bedroom),
      area (constituency → ward cascading dropdown), caretaker's mobile number
- [x] Centre: filter by price, size, and area (constituency/ward dropdown)
- [x] Scrollable list of listings, each with a "Chat on WhatsApp" button
      built from the caretaker's number
- [x] Bottom: site credits
- [x] Listings older than 3 weeks auto-expire (checked on load + hourly)
- [x] Maximum of 30 active listings enforced before accepting new uploads
