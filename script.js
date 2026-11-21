document.addEventListener('DOMContentLoaded', function() {
  const CART_KEY = 'huntly_cart';
  const TOWER_PRICE = 13999;
  const LID_PACK_PRICE = 1799;
  const FREE_SHIPPING_THRESHOLD = 5000;
  const SHIPPING_FEE = 149;

  // DOM elements
  const navCartCount = document.getElementById('cart-count');
  const navCartBtn = document.getElementById('nav-cart');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartCloseBtn = document.getElementById('cart-close');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartShippingEl = document.getElementById('cart-shipping');
  const cartTotalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      window.location.href = 'checkout.html';
    });
  }
  const drawerItemCountEl = document.getElementById('drawer-item-count');

  // Product page elements (may not exist on all pages)
  const addToCartBtn = document.getElementById('add-to-cart');
  const productTotalEl = document.getElementById('product-total');
  const swatches = document.querySelectorAll('.swatch');
  const lidPackCheckbox = document.getElementById('lid-pack');
  const productQtyInput = document.getElementById('product-qty');

  // Cart state
  let cart = loadCart();

  // ---------- Cart persistence ----------
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      // storage quota etc. - ignore silently
    }
  }

  function cartItemKey(color, lidPack) {
    return color + '|' + (lidPack ? 'lidpack' : 'base');
  }

  // ---------- Cart mutations ----------
  function addToCart(color, lidPack, qty) {
    const key = cartItemKey(color, lidPack);
    const existing = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        key: key,
        color: color,
        lidPack: lidPack,
        qty: qty
      });
    }
    saveCart();
    updateCartUI();
    openCart();
  }

  function setQty(key, qty) {
    if (qty < 1) qty = 1;
    const item = cart.find(i => i.key === key);
    if (item) item.qty = qty;
    saveCart();
    updateCartUI();
  }

  function removeItem(key) {
    cart = cart.filter(i => i.key !== key);
    saveCart();
    updateCartUI();
  }

  // ---------- Pricing ----------
  function getSubtotal() {
    return cart.reduce((sum, item) => {
      const unit = TOWER_PRICE + (item.lidPack ? LID_PACK_PRICE : 0);
      return sum + unit * item.qty;
    }, 0);
  }

  function getShipping(subtotal) {
    if (cart.length === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  }

  function formatINR(n) {
    return '₹' + n.toLocaleString('en-IN');
  }

  // ---------- UI ----------
  function updateCartUI() {
    updateCartCount();
    renderCartDrawer();
    updateProductTotal();
  }

  function updateCartCount() {
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    if (navCartCount) navCartCount.textContent = totalQty;
    if (drawerItemCountEl) drawerItemCountEl.textContent = totalQty + ' item' + (totalQty !== 1 ? 's' : '');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
  }

  function renderCartDrawer() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        '<div class="cart-empty"><p>Your cart is empty</p><p>Add a Huntly Tower to get started.</p></div>';
      if (cartSubtotalEl) cartSubtotalEl.textContent = formatINR(0);
      if (cartShippingEl) cartShippingEl.textContent = formatINR(0);
      if (cartTotalEl) cartTotalEl.textContent = formatINR(0);
      return;
    }

    const subtotal = getSubtotal();
    const shipping = getShipping(subtotal);
    const total = subtotal + shipping;

    cart.forEach(item => {
      const unit = TOWER_PRICE + (item.lidPack ? LID_PACK_PRICE : 0);
      const itemTotal = unit * item.qty;
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML =
        '<div class="cart-item-img" aria-hidden="true"></div>' +
        '<div class="cart-item-info">' +
        '<div class="cart-item-title">Huntly Tower &mdash; ' + escapeHtml(item.color) + (item.lidPack ? ' + Lid pack' : '') + '</div>' +
        '<div class="cart-item-price">' + formatINR(unit) + ' each</div>' +
        '<div class="cart-item-controls">' +
        '<button type="button" class="qty-decr" data-key="' + escapeAttr(item.key) + '">&#x2212;</button>' +
        '<span class="cart-item-qty">' + item.qty + '</span>' +
        '<button type="button" class="qty-incr" data-key="' + escapeAttr(item.key) + '">+</button>' +
        '</div>' +
        '</div>' +
        '<button type="button" class="remove-item" data-key="' + escapeAttr(item.key) + '">Remove</button>' +
        '<div style="margin-left:auto; font-weight:600;">' + formatINR(itemTotal) + '</div>' +
        '</div>';
      cartItemsContainer.appendChild(el);
    });

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatINR(subtotal);
    if (cartShippingEl) cartShippingEl.textContent = shipping === 0 ? 'Free' : formatINR(shipping);
    if (cartTotalEl) cartTotalEl.textContent = formatINR(total);

    // wire events
    cartItemsContainer.querySelectorAll('.qty-decr').forEach(btn => {
      btn.addEventListener('click', function() {
        const key = this.getAttribute('data-key');
        const item = cart.find(i => i.key === key);
        setQty(key, (item && item.qty) - 1);
      });
    });
    cartItemsContainer.querySelectorAll('.qty-incr').forEach(btn => {
      btn.addEventListener('click', function() {
        const key = this.getAttribute('data-key');
        const item = cart.find(i => i.key === key);
        setQty(key, (item && item.qty) + 1);
      });
    });
    cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', function() {
        removeItem(this.getAttribute('data-key'));
      });
    });
  }

  function updateProductTotal() {
    if (!productTotalEl || !lidPackCheckbox || !productQtyInput) return;
    const lid = lidPackCheckbox.checked;
    const qty = Math.max(1, parseInt(productQtyInput.value) || 1);
    const total = (TOWER_PRICE + (lid ? LID_PACK_PRICE : 0)) * qty;
    productTotalEl.textContent = formatINR(total);
  }

  function escapeHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(t) {
    return String(t).replace(/"/g, '&quot;');
  }

  // ---------- Cart drawer open/close ----------
  function openCart() {
    cartOverlay.classList.add('open');
    cartDrawer.classList.add('open');
    cartCloseBtn.focus();
  }

  function closeCart() {
    cartOverlay.classList.remove('open');
    cartDrawer.classList.remove('open');
    navCartBtn.focus();
  }

  if (navCartBtn) navCartBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Escape key closes cart
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && cartDrawer.classList.contains('open')) {
      closeCart();
    }
  });

  // ---------- Product page interactions ----------
  let selectedColor = 'sage';

  if (swatches.length) {
    swatches.forEach(swatch => {
      swatch.addEventListener('click', function() {
        swatches.forEach(s => {
          s.setAttribute('aria-pressed', 'false');
        });
        this.setAttribute('aria-pressed', 'true');
        selectedColor = this.getAttribute('data-color');
        updateProductTotal();
      });
    });
  }

  if (lidPackCheckbox) {
    lidPackCheckbox.addEventListener('change', updateProductTotal);
  }

  if (productQtyInput) {
    productQtyInput.addEventListener('input', updateProductTotal);
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      const qty = Math.max(1, parseInt(productQtyInput.value) || 1);
      addToCart(selectedColor, lidPackCheckbox.checked, qty);
    });
  }

  // ---------- FAQ accordion ----------
  function toggleAccordion(btn) {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    const icon = btn.querySelector('.accordion-icon');

    btn.setAttribute('aria-expanded', String(!expanded));
    if (panel) panel.hidden = expanded;
    if (icon) icon.textContent = expanded ? '+' : '−';
  }

  document.querySelectorAll('.accordion-header').forEach(function(btn) {
    btn.addEventListener('click', function() {
      toggleAccordion(this);
    });
    btn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion(this);
      }
    });
  });

  // ---------- Init ----------
  updateCartUI();
});