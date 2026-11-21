document.addEventListener('DOMContentLoaded', function() {
  const CART_KEY = 'huntly_cart';
  const ORDERS_KEY = 'huntly_orders';
  const TOWER_PRICE = 13999;
  const LID_PACK_PRICE = 1799;
  const FREE_SHIPPING_THRESHOLD = 5000;
  const SHIPPING_FEE = 149;

  const form = document.getElementById('checkout-form');
  const summaryEl = document.getElementById('checkout-summary');

  // Field error helpers
  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }
  function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  }

  // Load cart
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function loadOrders() {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveOrders(orders) {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {}
  }

  function getSubtotal(cart) {
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
    return '\u20B9' + n.toLocaleString('en-IN');
  }

  // Render summary
  function renderSummary() {
    const cart = loadCart();
    if (!summaryEl) return;
    if (cart.length === 0) {
      summaryEl.innerHTML = '<p>Your cart is empty.</p>';
      return;
    }
    let html = '<table class="summary-table"><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>';
    cart.forEach(item => {
      const unit = TOWER_PRICE + (item.lidPack ? LID_PACK_PRICE : 0);
      const itemTotal = unit * item.qty;
      html += '<tr>' +
        '<td>' + escapeHtml(item.color) + (item.lidPack ? ' + Lid pack' : '') + '</td>' +
        '<td>' + item.qty + '</td>' +
        '<td>' + formatINR(itemTotal) + '</td>' +
        '</tr>';
    });
    const subtotal = getSubtotal(cart);
    const shipping = getShipping(subtotal);
    const total = subtotal + shipping;
    html += '</tbody><tfoot>' +
      '<tr><td>Subtotal</td><td></td><td>' + formatINR(subtotal) + '</td></tr>' +
      '<tr><td>Shipping</td><td></td><td>' + (shipping === 0 ? 'Free' : formatINR(shipping)) + '</td></tr>' +
      '<tr><td><strong>Total</strong></td><td></td><td><strong>' + formatINR(total) + '</strong></td></tr>' +
      '</tfoot></table>';
    summaryEl.innerHTML = html;
  }

  function escapeHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Validation
  function validate() {
    clearErrors();
    let valid = true;

    const fields = {
      'contact-name': { el: 'contact-name', req: true },
      'contact-email': { el: 'contact-email', req: true },
      'contact-phone': { el: 'contact-phone', req: true },
      'ship-address': { el: 'ship-address', req: true },
      'ship-city': { el: 'ship-city', req: true },
      'ship-state': { el: 'ship-state', req: true },
      'ship-pincode': { el: 'ship-pincode', req: true },
      'pay-cardname': { el: 'pay-cardname', req: true },
      'pay-cardnumber': { el: 'pay-cardnumber', req: true },
      'pay-expiry': { el: 'pay-expiry', req: true },
      'pay-cvv': { el: 'pay-cvv', req: true }
    };

    Object.keys(fields).forEach(key => {
      const el = document.getElementById(fields[key].el);
      const errId = 'error-' + key;
      if (!el.value.trim()) {
        showError(errId, 'This field is required.');
        valid = false;
      }
    });

    // Email
    const emailEl = document.getElementById('contact-email');
    if (emailEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      showError('error-contact-email', 'Enter a valid email address.');
      valid = false;
    }

    // Phone 10 digits
    const phoneEl = document.getElementById('contact-phone');
    if (phoneEl.value.trim() && !/^\d{10}$/.test(phoneEl.value)) {
      showError('error-contact-phone', 'Phone must be 10 digits.');
      valid = false;
    }

    // Pincode 6 digits
    const pincodeEl = document.getElementById('ship-pincode');
    if (pincodeEl.value.trim() && !/^\d{6}$/.test(pincodeEl.value)) {
      showError('error-ship-pincode', 'Pincode must be 6 digits.');
      valid = false;
    }

    // Card number 16 digits
    const cardEl = document.getElementById('pay-cardnumber');
    if (cardEl.value.trim() && !/^\d{16}$/.test(cardEl.value)) {
      showError('error-pay-cardnumber', 'Card number must be 16 digits.');
      valid = false;
    }

    // Expiry MM/YY
    const expiryEl = document.getElementById('pay-expiry');
    if (expiryEl.value.trim() && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryEl.value)) {
      showError('error-pay-expiry', 'Use MM/YY format.');
      valid = false;
    }

    // CVV 3 digits
    const cvvEl = document.getElementById('pay-cvv');
    if (cvvEl.value.trim() && !/^\d{3}$/.test(cvvEl.value)) {
      showError('error-pay-cvv', 'CVV must be 3 digits.');
      valid = false;
    }

    // Cart not empty
    const cart = loadCart();
    if (cart.length === 0) {
      showError('error-contact-name', 'Your cart is empty. Add items before checkout.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!validate()) return;

    const cart = loadCart();
    const subtotal = getSubtotal(cart);
    const shipping = getShipping(subtotal);
    const total = subtotal + shipping;

    const order = {
      id: 'HNT' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      contact: {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim()
      },
      shipping: {
        address: document.getElementById('ship-address').value.trim(),
        city: document.getElementById('ship-city').value.trim(),
        state: document.getElementById('ship-state').value,
        pincode: document.getElementById('ship-pincode').value.trim()
      },
      items: cart.map(item => ({
        color: item.color,
        lidPack: item.lidPack,
        qty: item.qty,
        unit: TOWER_PRICE + (item.lidPack ? LID_PACK_PRICE : 0)
      })),
      subtotal: subtotal,
      shipping: shipping,
      total: total
    };

    const orders = loadOrders();
    orders.push(order);
    saveOrders(orders);

    // Clear cart
    localStorage.removeItem(CART_KEY);

    // Go to confirmation
    localStorage.setItem('huntly_last_order', order.id);
    window.location.href = 'confirmation.html?id=' + order.id;
  });

  renderSummary();
});