const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_LISTINGS = 30;
const LISTING_LIFETIME_MS = 21 * 24 * 60 * 60 * 1000;
const STORAGE_DIR = path.join(__dirname, "data");
const STORAGE_FILE = path.join(STORAGE_DIR, "listings.json");

function ensureStorage() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify([], null, 2));
  }
}

function readListings() {
  ensureStorage();
  try {
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function writeListings(listings) {
  ensureStorage();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(listings, null, 2));
}

function purgeExpiredListings(listings) {
  const now = Date.now();
  return listings.filter(listing => now - Number(listing.createdAt) < LISTING_LIFETIME_MS);
}

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, ".."), { index: false }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/listings", (_req, res) => {
  let listings = purgeExpiredListings(readListings());
  writeListings(listings);
  res.json(listings);
});

app.post("/api/listings", (req, res) => {
  const { price, size, constituency, ward, landmark, phoneWhatsApp, images } = req.body || {};

  if (!price || !size || !constituency || !ward || !phoneWhatsApp) {
    return res.status(400).json({ message: "Missing listing fields." });
  }

  const normalizedPrice = Number(price);
  const cleanImages = Array.isArray(images) ? images.slice(0, 5) : [];

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    return res.status(400).json({ message: "Price must be a valid positive number." });
  }

  if (cleanImages.length === 0) {
    return res.status(400).json({ message: "Please add at least one photo of the vacant house." });
  }

  let listings = purgeExpiredListings(readListings());

  if (listings.length >= MAX_LISTINGS) {
    return res.status(400).json({
      message: `Sorry, nyumbaFind currently allows a maximum of ${MAX_LISTINGS} active listings. Please try again once a slot frees up.`
    });
  }

  listings.unshift({
    id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    images: cleanImages,
    price: normalizedPrice,
    size,
    constituency,
    ward,
    landmark: landmark || "",
    phoneWhatsApp,
    createdAt: Date.now()
  });

  writeListings(listings);
  return res.status(201).json({ message: "Listing created successfully." });
});

app.get("/*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.listen(PORT, () => {
  console.log(`nyumbaFind backend running on http://localhost:${PORT}`);
});
