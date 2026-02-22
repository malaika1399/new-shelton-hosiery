/* =============================================
   NEW SHELTON HOSIERY – SHARED JAVASCRIPT
   ============================================= */

// ── NAVBAR SCROLL EFFECT ──
window.addEventListener('scroll', function () {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── TOAST NOTIFICATION ──
function showToast(msg) {
  let t = document.getElementById('toastMsg');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── ADD TO CART (localStorage based) ──
function addToCart(name, price) {
  let cart = JSON.parse(localStorage.getItem('nsh_cart') || '[]');
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  localStorage.setItem('nsh_cart', JSON.stringify(cart));
  updateCartBadge();
  showToast(name + ' added to bag ✓');
}

// ── UPDATE CART BADGE ──
function updateCartBadge() {
  let cart = JSON.parse(localStorage.getItem('nsh_cart') || '[]');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = count;
}

// ── COLOR DOT SELECTION ──
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', function () {
    this.closest('.color-dots').querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── RUN ON PAGE LOAD ──
document.addEventListener('DOMContentLoaded', function () {
  updateCartBadge();
});
