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

## ⚠️ Important: current data storage is local-only

Right now, listings are saved in the visitor's own browser via
**localStorage**. That means:
- A caretaker's upload is only visible on the device/browser they uploaded from.
- It will **not** appear for other people visiting the site from their own devices.

This is intentional for getting the front-end fully working first without
needing a server. To make listings truly shared across all visitors, you'll
need a small backend + database. Recommended low-effort options:

- **Supabase** (free tier, Postgres + storage for images) or **Firebase**
  (Firestore + Storage) — both have simple JS SDKs.
- Replace the two functions in `js/app.js` marked
  `// REPLACE WITH BACKEND CALL` (`getListings()` and `saveListings()`) with
  real API calls to your chosen backend.
- Image uploads: instead of storing base64 image data (fine for a local
  demo, but heavy at scale), upload files to Supabase/Firebase Storage and
  save just the resulting URLs in each listing record.
- The "3-week auto-expiry" and "max 30 listings" rules should then be
  enforced server-side too (e.g. a scheduled Vercel Cron Job that deletes
  expired rows, and a check before insert that rejects new listings once
  30 active ones exist).

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
