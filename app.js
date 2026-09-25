/* ==========================================================================
   NYUMBAFIND — APP LOGIC
   Connected to the local Express backend. All listing data is stored on the
   backend so that uploads are shared across devices instead of living only in
   browser localStorage.
   ========================================================================== */

const MAX_LISTINGS = 30;
const MAX_IMAGES_PER_LISTING = 5;
const LISTING_LIFETIME_MS = 21 * 24 * 60 * 60 * 1000; // 3 weeks
const THEME_KEY = "nyumbafind_theme";
const SLIDESHOW_IMAGES = [
  "slideshow/692358142758302873%20-%20Copy.jpg",
  "slideshow/Apartments%20-%20Copy.jpg",
  "slideshow/Contact%20us%20_0784448888%20%20%20Spacious%201%E2%80%934%20bedroom%E2%80%A6.jpg",
  "slideshow/TSAVO%20RESIDENCE%20-%20Copy.jpg",
  "slideshow/%F0%9F%93%8DKileleshwa_%20Newly%203-bedroom%20furnished%20apartments%E2%80%A6%20-%20Copy.jpg"
];

/* ---------------- BACKEND DATA HELPERS ---------------- */

async function getListings() {
  try {
    const response = await fetch("/api/listings");
    if (!response.ok) {
      throw new Error("Failed to load listings");
    }
    const listings = await response.json();
    return listings.filter(listing => Date.now() - Number(listing.createdAt) < LISTING_LIFETIME_MS);
  } catch (error) {
    console.error("Could not fetch listings from backend:", error);
    return [];
  }
}

async function getListingCount() {
  const listings = await getListings();
  return listings.length;
}

async function saveListings(listings) {
  return listings;
}

/* ---------------- THEME (DARK MODE) ---------------- */

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById("darkModeBtn");
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

/* ---------------- MODAL HELPERS ---------------- */

function openModal(id) {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.hidden = true;
  });
  document.getElementById(id).hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.hidden = true;

  const anyOpen = Array.from(document.querySelectorAll(".modal-overlay")).some(overlay => !overlay.hidden);
  document.body.style.overflow = anyOpen ? "hidden" : "";
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.hidden = true;
  });
  document.body.style.overflow = "";
}

/* ---------------- AREA DROPDOWNS (cascading constituency -> ward) ---------------- */

function populateConstituencies(selectEl) {
  Object.keys(NAIROBI_AREAS).forEach(constituency => {
    const opt = document.createElement("option");
    opt.value = constituency;
    opt.textContent = constituency;
    selectEl.appendChild(opt);
  });
}

function wireCascadingDropdown(constituencySelect, wardSelect, { includeAnyOption }) {
  constituencySelect.addEventListener("change", () => {
    const chosen = constituencySelect.value;
    wardSelect.innerHTML = "";

    if (!chosen) {
      wardSelect.disabled = true;
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = includeAnyOption ? "Any ward" : "Select constituency first";
      wardSelect.appendChild(opt);
      return;
    }

    wardSelect.disabled = false;
    if (includeAnyOption) {
      const anyOpt = document.createElement("option");
      anyOpt.value = "";
      anyOpt.textContent = "Any ward";
      wardSelect.appendChild(anyOpt);
    } else {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.textContent = "Select ward";
      wardSelect.appendChild(placeholder);
    }

    NAIROBI_AREAS[chosen].forEach(ward => {
      const opt = document.createElement("option");
      opt.value = ward;
      opt.textContent = ward;
      wardSelect.appendChild(opt);
    });
  });
}

/* ---------------- IMAGE UPLOAD (max 5, converted to data URLs) ---------------- */

let selectedImages = [];

function handleImageSelection(e) {
  const files = Array.from(e.target.files).slice(0, MAX_IMAGES_PER_LISTING);
  if (e.target.files.length > MAX_IMAGES_PER_LISTING) {
    showFormError(`Only the first ${MAX_IMAGES_PER_LISTING} photos were kept (max ${MAX_IMAGES_PER_LISTING}).`);
  }

  selectedImages = [];
  const preview = document.getElementById("imagePreview");
  preview.innerHTML = "";

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      selectedImages.push(reader.result);
      const img = document.createElement("img");
      img.src = reader.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- FORM SUBMISSION ---------------- */

function showFormError(msg) {
  const el = document.getElementById("formError");
  el.textContent = msg;
  el.hidden = false;
}

function clearFormError() {
  const el = document.getElementById("formError");
  el.hidden = true;
  el.textContent = "";
}

function normalizePhoneToWhatsApp(phone) {
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "254" + digits.slice(1);
  if (!digits.startsWith("254") && digits.length === 9) digits = "254" + digits;
  return digits;
}

async function handleListingSubmit(e) {
  e.preventDefault();
  clearFormError();

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const currentCount = await getListingCount();
    if (currentCount >= MAX_LISTINGS) {
      showFormError(`Sorry, nyumbaFind currently allows a maximum of ${MAX_LISTINGS} active listings. Please try again once a slot frees up.`);
      return;
    }

    if (selectedImages.length === 0) {
      showFormError("Please add at least one photo of the vacant house.");
      return;
    }

    const price = Number(document.getElementById("price").value);
    const size = document.getElementById("size").value;
    const constituency = document.getElementById("constituency").value;
    const ward = document.getElementById("ward").value;
    const landmark = document.getElementById("landmark").value.trim();
    const phoneRaw = document.getElementById("phone").value.trim();

    if (!constituency || !ward) {
      showFormError("Please select both constituency and ward.");
      return;
    }

    const phoneDigits = phoneRaw.replace(/[^\d]/g, "");
    if (phoneDigits.length < 9) {
      showFormError("Please enter a valid mobile number.");
      return;
    }

    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price,
        size,
        constituency,
        ward,
        landmark,
        phoneWhatsApp: normalizePhoneToWhatsApp(phoneRaw),
        images: selectedImages
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Something went wrong. Please try again.");
    }

    e.target.reset();
    selectedImages = [];
    document.getElementById("imagePreview").innerHTML = "";
    document.getElementById("ward").disabled = true;

    closeModal("listModal");
    await renderListings();
    await updateSlotsIndicator();
  } catch (error) {
    showFormError(error.message || "Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Listing";
  }
}

/* ---------------- RENDERING LISTINGS ---------------- */

function formatKES(amount) {
  return "KES " + Number(amount).toLocaleString("en-KE");
}

function timeAgo(timestamp) {
  const diffMs = Date.now() - Number(timestamp);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

async function getFilteredListings() {
  const listings = await getListings();
  const priceRange = document.getElementById("priceFilter").value;
  const size = document.getElementById("sizeFilter").value;
  const constituency = document.getElementById("constituencyFilter").value;
  const ward = document.getElementById("wardFilter").value;

  return listings.filter(l => {
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      if (l.price < min || l.price > max) return false;
    }
    if (size && l.size !== size) return false;
    if (constituency && l.constituency !== constituency) return false;
    if (ward && l.ward !== ward) return false;
    return true;
  }).sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

async function renderListings() {
  const grid = document.getElementById("listingsGrid");
  const emptyState = document.getElementById("emptyState");
  const listings = await getFilteredListings();

  grid.innerHTML = "";
  emptyState.hidden = listings.length !== 0;

  listings.forEach(listing => {
    const card = document.createElement("div");
    card.className = "listing-card";
    card.innerHTML = `
      <img class="card-thumb" src="${listing.images[0]}" alt="${listing.size} in ${listing.ward}" />
      <div class="listing-body">
        <div class="listing-price">${formatKES(listing.price)} / month</div>
        <div class="listing-size">${listing.size}</div>
        <div class="listing-area">${listing.ward}, ${listing.constituency}</div>
        <div class="listing-posted">${timeAgo(listing.createdAt)}</div>
        <a class="whatsapp-btn" target="_blank" rel="noopener"
           href="https://wa.me/${listing.phoneWhatsApp}?text=${encodeURIComponent(
             `Hi, I saw your ${listing.size} listing in ${listing.ward} on nyumbaFind (${formatKES(listing.price)}/month). Is it still available?`
           )}">
          💬 Chat on WhatsApp
        </a>
      </div>
    `;
    card.addEventListener("click", (evt) => {
      if (evt.target.closest(".whatsapp-btn")) return;
      openDetail(listing);
    });
    grid.appendChild(card);
  });
}

function openDetail(listing) {
  const content = document.getElementById("detailContent");
  content.innerHTML = `
    <div class="detail-gallery">
      ${listing.images.map(src => `<img src="${src}" alt="Property photo" />`).join("")}
    </div>
    <div class="detail-row"><span class="detail-label">Price:</span> ${formatKES(listing.price)} / month</div>
    <div class="detail-row"><span class="detail-label">Size:</span> ${listing.size}</div>
    <div class="detail-row"><span class="detail-label">Location:</span> ${listing.ward}, ${listing.constituency}</div>
    ${listing.landmark ? `<div class="detail-row"><span class="detail-label">Landmark:</span> ${listing.landmark}</div>` : ""}
    <div class="detail-row"><span class="detail-label">Posted:</span> ${timeAgo(listing.createdAt)}</div>
    <a class="whatsapp-btn" style="margin-top:14px;" target="_blank" rel="noopener"
       href="https://wa.me/${listing.phoneWhatsApp}?text=${encodeURIComponent(
         `Hi, I saw your ${listing.size} listing in ${listing.ward} on nyumbaFind (${formatKES(listing.price)}/month). Is it still available?`
       )}">
      💬 Chat on WhatsApp
    </a>
  `;
  openModal("detailModal");
}

async function updateSlotsIndicator() {
  const count = await getListingCount();
  document.getElementById("slotsIndicator").textContent = `${count} / ${MAX_LISTINGS} slots used`;
  document.getElementById("slotsMessage").textContent =
    count >= MAX_LISTINGS
      ? "The site is currently full (30/30). Please check back once a listing expires."
      : `${MAX_LISTINGS - count} listing slot(s) remaining. Listings auto-expire after 3 weeks.`;
}

/* ---------------- HERO SLIDESHOW ---------------- */

let slideshowIndex = 0;

function initSlideshow() {
  const panel = document.getElementById("slideshowPanel");
  if (!panel || !SLIDESHOW_IMAGES.length) return;

  const applySlide = (index) => {
    const image = SLIDESHOW_IMAGES[index % SLIDESHOW_IMAGES.length];
    panel.style.backgroundImage = `linear-gradient(135deg, rgba(10, 25, 34, 0.65), rgba(15, 62, 58, 0.42)), url("${image}")`;
  };

  applySlide(slideshowIndex);
  setInterval(() => {
    slideshowIndex = (slideshowIndex + 1) % SLIDESHOW_IMAGES.length;
    applySlide(slideshowIndex);
  }, 4200);
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  initTheme();
  initSlideshow();
  document.getElementById("darkModeBtn").addEventListener("click", toggleTheme);

  document.getElementById("aboutBtn").addEventListener("click", () => openModal("aboutModal"));
  document.getElementById("listPropertyBtn").addEventListener("click", async () => {
    await updateSlotsIndicator();
    openModal("listModal");
  });

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllModals();
  });

  closeAllModals();

  populateConstituencies(document.getElementById("constituencyFilter"));
  populateConstituencies(document.getElementById("constituency"));

  wireCascadingDropdown(
    document.getElementById("constituencyFilter"),
    document.getElementById("wardFilter"),
    { includeAnyOption: true }
  );
  wireCascadingDropdown(
    document.getElementById("constituency"),
    document.getElementById("ward"),
    { includeAnyOption: false }
  );

  ["priceFilter", "sizeFilter", "constituencyFilter", "wardFilter"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      renderListings();
    });
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    document.getElementById("priceFilter").value = "";
    document.getElementById("sizeFilter").value = "";
    document.getElementById("constituencyFilter").value = "";
    document.getElementById("wardFilter").innerHTML = '<option value="">Any ward</option>';
    document.getElementById("wardFilter").disabled = true;
    renderListings();
  });

  document.getElementById("images").addEventListener("change", handleImageSelection);
  document.getElementById("listingForm").addEventListener("submit", handleListingSubmit);

  renderListings();
  updateSlotsIndicator();

  setInterval(() => {
    renderListings();
    updateSlotsIndicator();
  }, 60 * 60 * 1000);
});
