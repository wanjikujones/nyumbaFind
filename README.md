# nyumbaFind

A modern Nairobi rental discovery platform for finding vacant houses and apartments quickly. Users can browse available listings, filter by price, size, and area, then contact property owners directly through WhatsApp.

## Features

- Browse vacant rental listings in Nairobi and nearby areas
- Filter by price, size, and location
- Search by constituency and ward
- View listing details and photos
- Contact property owners directly via WhatsApp
- Add new rental listings with up to five images
- Live filtering and premium landing-page styling
- Shared backend storage for listings instead of browser-only localStorage

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express
- JSON file-based persistence in the backend

## Project Structure

```text
nyumbaFind/
├── app.js
├── data.js
├── index.html
├── style.css
├── README.md
├── slideshow/
│   ├── ...property images for the homepage slideshow
├── nyumbaFind-Backend/
│   ├── app.js
│   ├── README.md
│   ├── schema.sql
│   ├── supabaseClient.js
└── .gitignore
```

## Getting Started

### 1) Install backend dependencies

```bash
cd nyumbaFind-Backend
npm install
```

### 2) Start the app

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## How it works

- The frontend fetches listings from the backend API.
- New listings are submitted through a form and saved server-side.
- Listings auto-expire after three weeks.
- The app limits active listings to 30 entries.

## Main Files

- `index.html` — app layout, modal structure, and branded header
- `style.css` — premium styling and responsive design
- `app.js` — frontend logic, filters, modals, listings, and slideshow
- `data.js` — Nairobi and regional area data for the filter dropdown
- `nyumbaFind-Backend/app.js` — Express server and API routes

## Branding

Designed & built by:

- WANJIKU ISRAEL
- Email: wanjikuisrael@gmail.com

## License

This project is for educational and personal use.

## Future Improvements

- Add admin moderation
- Add authentication for listing owners
- Store listings in a real database such as PostgreSQL or Supabase
- Add a map view for listings
- Improve image optimization and CDN hosting

## Contributing

Pull requests are welcome. Please open an issue first for major changes.
