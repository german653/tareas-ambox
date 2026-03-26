/* =====================================================
   NANO iPhone Store — main.js  (v2 — Full Cart)
   ===================================================== */

// ─── LIVE CLOCK ───
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const el = document.getElementById('screenTime');
  if (el) el.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 30000);

// ─── NAVBAR SCROLL EFFECT ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
  updateActiveLink();
}, { passive: true });

function updateActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

// ─── HAMBURGER MENU ───
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinksEl.classList.toggle('open');
  hamburger.classList.toggle('open');
});
navLinksEl.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinksEl.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

// ─── SCROLL REVEAL ───
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => entry.target.classList.add('visible'), Number(delay));
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.products-grid .reveal-up').forEach((el, i) => { el.dataset.delay = i * 80; });
document.querySelectorAll('.features-grid .reveal-up').forEach((el, i) => { el.dataset.delay = i * 70; });
document.querySelectorAll('.stats-grid .reveal-up').forEach((el, i) => { el.dataset.delay = i * 100; });
document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

// ─── COUNTER ANIMATION ───
function animateCounter(el, target, duration = 1800) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('es-AR');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString('es-AR');
  };
  requestAnimationFrame(step);
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target, parseInt(entry.target.dataset.target, 10));
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.stat-number').forEach(el => statsObserver.observe(el));

// ─── PRODUCT FILTER ───
const filterBtns = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    productCards.forEach((card, i) => {
      const show = filter === 'all' || card.dataset.category === filter;
      if (show) {
        card.classList.remove('hidden');
        card.classList.remove('visible');
        setTimeout(() => card.classList.add('visible'), i * 60);
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ────────────────────────────────────────────────────
//  CART SYSTEM
// ────────────────────────────────────────────────────

/** @type {Array<{id:string, name:string, price:number, color:string, qty:number}>} */
let cart = [];

// DOM refs
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartItemsList = document.getElementById('cartItemsList');
const cartEmpty = document.getElementById('cartEmpty');
const cartFooter = document.getElementById('cartFooter');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal = document.getElementById('cartTotal');
const btnCheckout = document.getElementById('btnCheckout');

// Checkout modal refs
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutClose = document.getElementById('checkoutClose');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutOrderPreview = document.getElementById('checkoutOrderPreview');
const inputNombre = document.getElementById('inputNombre');
const inputApellido = document.getElementById('inputApellido');
const formError = document.getElementById('formError');

// ── Open / Close Cart Panel ──
function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ESC key to close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart();
    closeCheckout();
  }
});

// ── Format Price ──
function fmt(n) {
  return '$' + n.toLocaleString('es-AR');
}

// ── Render Cart ──
function renderCart() {
  cartItemsList.innerHTML = '';

  const isEmpty = cart.length === 0;
  cartEmpty.classList.toggle('visible', isEmpty);
  cartFooter.classList.toggle('visible', !isEmpty);

  if (isEmpty) return;

  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-thumb" style="--thumb-color: ${item.color};"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price)}</div>
      </div>
      <div class="cart-item-controls">
        <div class="qty-row">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Quitar uno">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Agregar uno">+</button>
        </div>
        <button class="cart-item-remove" data-id="${item.id}">Eliminar</button>
      </div>
    `;
    cartItemsList.appendChild(div);
  });

  // Qty buttons
  cartItemsList.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;
      if (action === 'inc') {
        cart[idx].qty++;
      } else {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      updateCartBadge();
      renderCart();
    });
  });

  // Remove buttons
  cartItemsList.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart = cart.filter(i => i.id !== btn.dataset.id);
      updateCartBadge();
      renderCart();
    });
  });

  // Totals
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  cartSubtotal.textContent = fmt(total);
  cartTotal.textContent = fmt(total);
}

// ── Update Badge ──
function updateCartBadge() {
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  cartBadge.textContent = total;
  cartBadge.classList.toggle('visible', total > 0);
}

// ── Add to Cart (called from btn click) ──
function addToCart(id, name, price, color) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, color, qty: 1 });
  }
  updateCartBadge();

  // Toast
  const toast = document.getElementById('cartToast');
  document.getElementById('toastMsg').textContent = `${name} agregado al carrito`;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);

  // Button feedback on the clicked button
  const btn = document.querySelector(`[data-id="${id}"].btn-add-cart`);
  if (btn) {
    const orig = btn.textContent.trim();
    btn.textContent = '✓ Agregado';
    btn.style.background = 'linear-gradient(135deg,#059669,#10b981)';
    btn.style.borderColor = 'transparent';
    btn.style.color = '#fff';
    clearTimeout(btn._resetTimer);
    btn._resetTimer = setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  }
}
window.addToCart = addToCart;

// Wire up all "Agregar al carrito" buttons
document.querySelectorAll('.btn-add-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const { id, name, price, color } = btn.dataset;
    addToCart(id, name, parseInt(price, 10), color);
  });
});

// ── Open Checkout ──
btnCheckout.addEventListener('click', () => {
  if (cart.length === 0) return;
  closeCart();
  buildCheckoutPreview();
  checkoutOverlay.classList.add('active');
  checkoutModal.classList.add('active');
  inputNombre.focus();
  document.body.style.overflow = 'hidden';
});

function buildCheckoutPreview() {
  let html = '';
  cart.forEach(item => {
    html += `
      <div class="checkout-preview-item">
        <span>${item.name} x${item.qty}</span>
        <span>${fmt(item.price * item.qty)}</span>
      </div>`;
  });
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  html += `<div class="checkout-preview-total"><span>Total</span><span>${fmt(total)}</span></div>`;
  checkoutOrderPreview.innerHTML = html;
}

function closeCheckout() {
  checkoutOverlay.classList.remove('active');
  checkoutModal.classList.remove('active');
  document.body.style.overflow = '';
}

checkoutClose.addEventListener('click', closeCheckout);
checkoutOverlay.addEventListener('click', closeCheckout);

// ── Submit → WhatsApp ──
checkoutForm.addEventListener('submit', e => {
  e.preventDefault();
  formError.textContent = '';

  const nombre = inputNombre.value.trim();
  const apellido = inputApellido.value.trim();

  if (!nombre) { formError.textContent = 'Por favor ingresá tu nombre.'; inputNombre.focus(); return; }
  if (!apellido) { formError.textContent = 'Por favor ingresá tu apellido.'; inputApellido.focus(); return; }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Build WhatsApp message
  let msg = `¡Hola! Soy *${nombre} ${apellido}* y quiero hacer el siguiente pedido en NANO:\n\n`;
  cart.forEach(item => {
    msg += `• *${item.name}* x${item.qty} — ${fmt(item.price * item.qty)}\n`;
  });
  msg += `\n*Total: ${fmt(total)}*\n\n¡Quedo a la espera de su respuesta! 🙌`;

  const phone = '5493513427543';
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  // Open WhatsApp
  window.open(url, '_blank');

  // Clear cart
  cart = [];
  updateCartBadge();
  renderCart();
  closeCheckout();

  // Reset form
  checkoutForm.reset();
  formError.textContent = '';
});

// ─── INITIAL RENDER ───
renderCart();

// ─── SMOOTH SCROLL ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ─── PRODUCT CARD 3D TILT ───
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    card.style.transform = `translateY(-6px) perspective(600px) rotateX(${((y - cy) / cy) * 6}deg) rotateY(${((x - cx) / cx) * -6}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ─── FEATURE CARD HOVER GLOW ───
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.background = `radial-gradient(circle at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, rgba(124,58,237,0.08), rgba(255,255,255,0.01) 60%)`;
  });
  card.addEventListener('mouseleave', () => { card.style.background = ''; });
});

// ─── PARALLAX ORB ───
window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 30;
  const y = (e.clientY / window.innerHeight - 0.5) * 30;
  const orb1 = document.querySelector('.orb-1');
  const orb2 = document.querySelector('.orb-2');
  if (orb1) orb1.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
  if (orb2) orb2.style.transform = `translate(${-x * 0.4}px, ${-y * 0.4}px)`;
}, { passive: true });

// ─── PAGE LOAD FADE ───
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';
window.addEventListener('load', () => { document.body.style.opacity = '1'; });
