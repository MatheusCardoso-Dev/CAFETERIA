// Utilities
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// Mobile nav toggle
const navToggle = $('.nav-toggle');
const mainNav = $('.main-nav');
if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
  $$('.main-nav a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('open')));
}

// Smooth scroll for in-page links
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Intersection observer for reveal animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

$$('.section, .menu-item, .review, .form, .orders-info, .cart, .gallery img').forEach(el => {
  el.setAttribute('data-animate', '');
  observer.observe(el);
});

// Menu filters
const filterButtons = $$('.filter');
const items = $$('.menu-item');
filterButtons.forEach(btn => btn.addEventListener('click', () => {
  filterButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const f = btn.dataset.filter;
  items.forEach(it => {
    it.style.display = (f === 'all' || it.classList.contains(f)) ? 'grid' : 'none';
  });
}));

// Simple cart
const cart = new Map();
const cartItemsEl = $('#cartItems');
const cartTotalEl = $('#cartTotal');
const checkoutBtn = $('#checkoutBtn');
const clearCartBtn = $('#clearCartBtn');

function formatBRL(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function updateCartUI() {
  cartItemsEl.innerHTML = '';
  let total = 0;
  for (const [name, item] of cart) {
    total += item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <span>${name} <small style="color:#aaa">x${item.qty}</small></span>
      <div class="cart-qty">
        <button aria-label="Diminuir" data-action="dec" data-name="${name}">−</button>
        <button aria-label="Aumentar" data-action="inc" data-name="${name}">+</button>
      </div>
      <button class="cart-remove" aria-label="Remover" data-action="del" data-name="${name}"><i class="fa-solid fa-trash"></i></button>
    `;
    cartItemsEl.appendChild(row);
  }
  cartTotalEl.textContent = formatBRL(total);
  const hasItems = cart.size > 0;
  checkoutBtn.disabled = !hasItems;
  clearCartBtn.disabled = !hasItems;
}

function addToCart(name, price) {
  if (cart.has(name)) cart.get(name).qty += 1; else cart.set(name, { price, qty: 1 });
  updateCartUI();
}

function sendWhatsAppWithCart() {
  if (cart.size === 0) return;
  let lines = [];
  let total = 0;
  for (const [name, item] of cart) {
    const line = `${item.qty}x ${name} — ${formatBRL(item.price * item.qty)}`;
    lines.push(line);
    total += item.price * item.qty;
  }
  lines.push(`Total: ${formatBRL(total)}`);
  const msg = `Olá! Gostaria de finalizar meu pedido:%0A%0A${lines.map(l => encodeURIComponent(l)).join('%0A')}`;
  const phone = '5543984336883';
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

// Bind add buttons
$$('.menu-item .add').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.menu-item');
    const name = card.dataset.name;
    const price = Number(card.dataset.price);
    addToCart(name, price);
  });
});

// Cart actions
cartItemsEl.addEventListener('click', e => {
  const target = e.target.closest('button');
  if (!target) return;
  const name = target.dataset.name;
  const action = target.dataset.action;
  const item = cart.get(name);
  if (!item) return;
  if (action === 'inc') item.qty += 1;
  if (action === 'dec') item.qty = Math.max(0, item.qty - 1);
  if (action === 'del' || item.qty === 0) cart.delete(name);
  updateCartUI();
});

checkoutBtn.addEventListener('click', sendWhatsAppWithCart);
clearCartBtn.addEventListener('click', () => { cart.clear(); updateCartUI(); });

// Reservation form -> WhatsApp
const reservationForm = $('#reservationForm');
const feedback = $('#formFeedback');
reservationForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(reservationForm);
  const nome = (data.get('nome') || '').toString().trim();
  const telefone = (data.get('telefone') || '').toString().trim();
  const dia = data.get('data');
  const hora = data.get('hora');
  const pessoas = data.get('pessoas');
  const mensagem = (data.get('mensagem') || '').toString().trim();
  if (!nome || !telefone || !dia || !hora || !pessoas) {
    feedback.textContent = 'Por favor, preencha todos os campos obrigatórios.';
    return;
  }
  const texto = `Olá! Gostaria de fazer uma reserva.%0A%0A` +
    `Nome: ${encodeURIComponent(nome)}%0A` +
    `Telefone: ${encodeURIComponent(telefone)}%0A` +
    `Data: ${encodeURIComponent(dia)}%0A` +
    `Horário: ${encodeURIComponent(hora)}%0A` +
    `Pessoas: ${encodeURIComponent(pessoas)}%0A` +
    (mensagem ? `Mensagem: ${encodeURIComponent(mensagem)}%0A` : '');
  const phone = '5543984336883';
  window.open(`https://wa.me/${phone}?text=${texto}`, '_blank');
  feedback.textContent = 'Abrindo WhatsApp com sua reserva...';
});

// Flatpickr date/time pickers
if (window.flatpickr) {
  try {
    const dateInput = document.querySelector('input[name="data"]');
    const timeInput = document.querySelector('input[name="hora"]');
    if (dateInput) {
      flatpickr.localize(flatpickr.l10ns.pt || {});
      flatpickr(dateInput, {
        minDate: 'today',
        dateFormat: 'd/m/Y',
        altInput: true,
        altFormat: 'F j, Y',
        disableMobile: true,
      });
    }
    if (timeInput) {
      flatpickr(timeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        time_24hr: true,
        minuteIncrement: 15,
        disableMobile: true,
      });
    }
  } catch (err) {
    // ignore
  }
}

// Footer year
const y = new Date().getFullYear();
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = y.toString();


