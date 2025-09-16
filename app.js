/* Data */
const SPORTS = [
  "Running",
  "Basketball",
  "Football",
  "Tennis",
  "Cricket",
  "Training",
  "Yoga",
  "Cycling",
  "Golf",
  "Skateboarding",
];

const BRANDS = ["Adidas", "Nike", "Puma", "Under Armour", "New Balance", "Asics"];

const PRODUCTS = [
  { id: "p1", name: "Adidas Ultraboost 22", brand: "Adidas", sport: "Running", price: 149.99, image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop" },
  { id: "p2", name: "Nike Air Zoom Pegasus", brand: "Nike", sport: "Running", price: 129.99, image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800&auto=format&fit=crop" },
  { id: "p3", name: "Nike Elite Basketball", brand: "Nike", sport: "Basketball", price: 29.99, image: "https://images.unsplash.com/photo-1599050751795-5f5f25a3f0c2?q=80&w=800&auto=format&fit=crop" },
  { id: "p4", name: "Adidas Harden Vol. 7", brand: "Adidas", sport: "Basketball", price: 159.99, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop" },
  { id: "p5", name: "Puma Future Z Football", brand: "Puma", sport: "Football", price: 24.99, image: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=800&auto=format&fit=crop" },
  { id: "p6", name: "Under Armour Tee", brand: "Under Armour", sport: "Training", price: 19.99, image: "https://images.unsplash.com/photo-1542291026-94f52b4f4fa5?q=80&w=800&auto=format&fit=crop" },
  { id: "p7", name: "Asics Gel-Kayano", brand: "Asics", sport: "Running", price: 139.99, image: "https://images.unsplash.com/photo-1520974735194-5f1cdb71ea2c?q=80&w=800&auto=format&fit=crop" },
  { id: "p8", name: "New Balance 550", brand: "New Balance", sport: "Training", price: 109.99, image: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=800&auto=format&fit=crop" },
  { id: "p9", name: "Wilson Tennis Racket", brand: "Nike", sport: "Tennis", price: 89.99, image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=800&auto=format&fit=crop" },
  { id: "p10", name: "Adidas Yoga Mat", brand: "Adidas", sport: "Yoga", price: 39.99, image: "https://images.unsplash.com/photo-1603791452906-be44829c1562?q=80&w=800&auto=format&fit=crop" },
];

/* State */
const state = {
  user: null,
  filters: { brands: new Set(), sports: new Set(), query: "", sort: "personalized" },
  cart: new Map(), // id -> { product, qty }
};

/* Utils */
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
function formatPrice(n) { return `$${n.toFixed(2)}`; }
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.lang = navigator.language || "en-US";
  window.speechSynthesis.speak(utter);
}

function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 2200);
}

/* Countries */
async function loadCountries() {
  const sel = $("#country");
  try {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
    const data = await res.json();
    data
      .map(c => c.name?.common)
      .filter(Boolean)
      .sort((a,b) => a.localeCompare(b))
      .forEach(name => {
        const opt = document.createElement("option");
        opt.value = name; opt.textContent = name;
        sel.appendChild(opt);
      });
  } catch (e) {
    ["United States","India","United Kingdom","Germany","France","Canada"].forEach(name => {
      const opt = document.createElement("option"); opt.value = name; opt.textContent = name; sel.appendChild(opt);
    });
  }
}

/* Registration */
function openRegistration() {
  const modal = $("#registrationModal");
  modal.hidden = false;
  speak("Welcome to SportShop. Please complete your quick registration to personalize your experience.");
}

function closeRegistration() { $("#registrationModal").hidden = true; }

function setupChips(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = item;
    btn.addEventListener("click", () => {
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
    });
    container.appendChild(btn);
  });
}

function getSelectedChips(containerId) {
  return Array.from(document.getElementById(containerId).querySelectorAll('.chip[aria-pressed="true"]')).map(b => b.textContent);
}

function calcAge(dobStr) {
  const d = new Date(dobStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function initRegistration() {
  setupChips("sportsChips", SPORTS);
  setupChips("brandsChips", BRANDS);
  loadCountries();

  const dob = $("#dob");
  const ageDisplay = $("#ageDisplay");
  // Prevent selecting a future date
  try { dob.max = new Date().toISOString().split('T')[0]; } catch {}
  dob.addEventListener("input", () => {
    const age = calcAge(dob.value);
    ageDisplay.textContent = age != null ? `You are ${age} years old` : "";
  });

  $("#registrationForm").addEventListener("submit", e => {
    e.preventDefault();
    const user = {
      name: $("#fullName").value.trim(),
      dob: $("#dob").value,
      country: $("#country").value,
      email: $("#email").value.trim(),
      phone: $("#phone").value.trim(),
      sports: getSelectedChips("sportsChips"),
      brands: getSelectedChips("brandsChips"),
    };

    const age = calcAge(user.dob);
    if (!user.name || !user.dob || !user.country || !user.email || !user.phone) {
      showToast("Please complete all required fields.");
      speak("Please complete all required fields.");
      return;
    }
    if (age != null && age < 13) {
      showToast("You must be 13+ to register.");
      speak("Sorry, you must be thirteen or older to register.");
      return;
    }

    state.user = user;
    // Initialize filters from user preferences
    state.filters.brands = new Set(user.brands || []);
    state.filters.sports = new Set(user.sports || []);
    localStorage.setItem("sportshop_user", JSON.stringify(user));
    closeRegistration();
    speak(`Thanks ${user.name}. Personalizing your store now.`);
    applyPersonalization();
    render();
  });

  $("#closeRegistration").addEventListener("click", closeRegistration);
}

/* Catalog and Filters */
function applyPersonalization() {
  const brandFilters = $("#brandFilters");
  const sportFilters = $("#sportFilters");
  brandFilters.innerHTML = ""; sportFilters.innerHTML = "";

  BRANDS.forEach(brand => {
    const id = `brand-${brand}`;
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox"; input.value = brand; input.id = id;
    if (state.user?.brands?.includes(brand)) input.checked = true;
    input.addEventListener("change", () => { toggleFilter("brands", brand, input.checked); });
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + brand));
    brandFilters.appendChild(label);
  });

  SPORTS.forEach(sport => {
    const id = `sport-${sport}`;
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox"; input.value = sport; input.id = id;
    if (state.user?.sports?.includes(sport)) input.checked = true;
    input.addEventListener("change", () => { toggleFilter("sports", sport, input.checked); });
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + sport));
    sportFilters.appendChild(label);
  });
}

function toggleFilter(type, value, enabled) {
  const set = state.filters[type];
  if (!(set instanceof Set)) return;
  enabled ? set.add(value) : set.delete(value);
  renderProducts();
}

function filteredProducts() {
  const q = state.filters.query.toLowerCase();
  let list = PRODUCTS.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.sport.toLowerCase().includes(q)) &&
    (state.filters.brands.size === 0 || state.filters.brands.has(p.brand)) &&
    (state.filters.sports.size === 0 || state.filters.sports.has(p.sport))
  );

  const sort = state.filters.sort;
  if (sort === "price-asc") list.sort((a,b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a,b) => b.price - a.price);
  else if (sort === "name-asc") list.sort((a,b) => a.name.localeCompare(b.name));
  else if (sort === "personalized" && state.user) {
    const brandBoost = new Set(state.user.brands);
    const sportBoost = new Set(state.user.sports);
    list.sort((a,b) => {
      const aScore = (brandBoost.has(a.brand) ? 2 : 0) + (sportBoost.has(a.sport) ? 1 : 0);
      const bScore = (brandBoost.has(b.brand) ? 2 : 0) + (sportBoost.has(b.sport) ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
      return a.name.localeCompare(b.name);
    });
  }
  return list;
}

function renderProducts() {
  const grid = $("#productsGrid");
  grid.innerHTML = "";
  const list = filteredProducts();
  if (list.length === 0) {
    grid.innerHTML = `<p class="subtle">No products match your filters.</p>`;
    return;
  }
  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-media"><img alt="${p.name}" src="${p.image}" loading="lazy" /></div>
      <div class="product-body">
        <div class="product-title">${p.name}</div>
        <div class="product-meta">${p.brand} • ${p.sport}</div>
        <div class="price-row">
          <div class="price">${formatPrice(p.price)}</div>
          <button class="add-btn" data-id="${p.id}">Add</button>
        </div>
      </div>`;
    card.querySelector(".add-btn").addEventListener("click", () => addToCart(p.id));
    grid.appendChild(card);
  });
}

/* Cart */
function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const item = state.cart.get(id) || { product, qty: 0 };
  item.qty += 1; state.cart.set(id, item);
  updateCartUI();
  speak(`${product.name} added to your cart.`);
}

function updateCartUI() {
  $("#cartCount").textContent = Array.from(state.cart.values()).reduce((s, it) => s + it.qty, 0);
  const itemsEl = $("#cartItems");
  itemsEl.innerHTML = "";
  let subtotal = 0;
  for (const { product, qty } of state.cart.values()) {
    subtotal += product.price * qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div>
        <div>${product.name}</div>
        <div class="product-meta">${product.brand} • ${product.sport}</div>
        <div class="product-meta">${formatPrice(product.price)} each</div>
      </div>
      <div class="qty">
        <button aria-label="Decrease" data-id="${product.id}" data-action="dec">-</button>
        <span>${qty}</span>
        <button aria-label="Increase" data-id="${product.id}" data-action="inc">+</button>
      </div>`;
    row.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(product.id, -1));
    row.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(product.id, 1));
    itemsEl.appendChild(row);
  }
  $("#cartSubtotal").textContent = formatPrice(subtotal);
}

function changeQty(id, delta) {
  const item = state.cart.get(id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart.delete(id);
  updateCartUI();
}

/* Voice Help Bot */
function helpReply(text) {
  const log = $("#helpTranscript");
  const div = document.createElement("div");
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  speak(text);
}

function processHelpQuery(q) {
  const lower = q.toLowerCase();
  if (lower.includes("find") || lower.includes("show")) {
    // try to parse simple brand/sport queries
    for (const b of BRANDS) {
      if (lower.includes(b.toLowerCase())) state.filters.brands.add(b);
    }
    for (const s of SPORTS) {
      if (lower.includes(s.toLowerCase())) state.filters.sports.add(s);
    }
    renderProducts();
    return `Updated filters for: ${[...state.filters.brands, ...state.filters.sports].join(", ") || "your preferences"}.`;
  }
  if (lower.includes("cart")) {
    openCart();
    return "Opening your cart.";
  }
  if (lower.includes("reset") || lower.includes("clear")) {
    state.filters.brands.clear();
    state.filters.sports.clear();
    renderProducts();
    return "Cleared filters.";
  }
  return "I can help you find items. Try: find nike running shoes.";
}

function openHelp() { $("#helpBot").hidden = false; }
function closeHelp() { $("#helpBot").hidden = true; }

function startSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast("Speech recognition not supported in this browser.");
    return null;
  }
  const rec = new SR();
  rec.lang = navigator.language || "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    $("#helpInput").value = transcript;
    const reply = processHelpQuery(transcript);
    helpReply(reply);
  };
  rec.onerror = () => showToast("Speech recognition error");
  rec.onend = () => {};
  rec.start();
  return rec;
}

/* Cart Drawer */
function openCart() { const el = $("#cartDrawer"); el.hidden = false; el.setAttribute("open", ""); }
function closeCart() { const el = $("#cartDrawer"); el.hidden = true; el.removeAttribute("open"); }

/* Render */
function render() {
  renderProducts();
  updateCartUI();
}

/* Init */
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("sportshop_user");
  if (saved) state.user = JSON.parse(saved);

  initRegistration();
  applyPersonalization();
  render();

  if (!state.user) {
    openRegistration();
  } else {
    speak(`Welcome back ${state.user.name}. Here are your recommendations.`);
    // Preseed filter sets with user's preferences on load
    (state.user.brands || []).forEach(b => state.filters.brands.add(b));
    (state.user.sports || []).forEach(s => state.filters.sports.add(s));
    renderProducts();
  }

  // Search
  $("#searchInput").addEventListener("input", (e) => { state.filters.query = e.target.value; renderProducts(); });
  $("#sortSelect").addEventListener("change", (e) => { state.filters.sort = e.target.value; renderProducts(); });

  // Cart
  $("#cartButton").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#checkoutButton").addEventListener("click", () => { speak("Proceeding to checkout. This is a demo."); showToast("Checkout is a demo in this build."); });

  // Help bot
  $("#helpBotToggle").addEventListener("click", openHelp);
  $("#helpBotClose").addEventListener("click", closeHelp);
  $("#helpSend").addEventListener("click", () => {
    const q = $("#helpInput").value.trim();
    if (!q) return;
    const reply = processHelpQuery(q);
    helpReply(reply);
  });
  $("#helpSpeak").addEventListener("click", () => { startSpeechRecognition(); });
  $("#helpStop").addEventListener("click", () => { window.speechSynthesis?.cancel(); });
});

