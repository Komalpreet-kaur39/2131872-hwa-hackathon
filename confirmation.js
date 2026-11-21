document.addEventListener('DOMContentLoaded', function() {
  const ORDERS_KEY = 'huntly_orders';
  const formatINR = function(n) {
    return '\u20B9' + n.toLocaleString('en-IN');
  };

  function loadOrders() {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');
  const storedLast = localStorage.getItem('huntly_last_order');
  const id = orderId || storedLast;

  const orderNumberEl = document.getElementById('order-number');
  const orderNameEl = document.getElementById('order-name');
  const confirmItemsEl = document.getElementById('confirm-items');
  const confirmSubtotalEl = document.getElementById('confirm-subtotal');
  const confirmShippingEl = document.getElementById('confirm-shipping');
  const confirmTotalEl = document.getElementById('confirm-total');
  const confirmAddressEl = document.getElementById('confirm-address');
  const confirmCityEl = document.getElementById('confirm-city');
  const confirmDeliveryEl = document.getElementById('confirm-delivery');

  function shippingField(order, keys) {
    const shipping = order && order.shipping;
    if (!shipping) return undefined;
    for (var i = 0; i < keys.length; i++) {
      var v = shipping[keys[i]];
      if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return undefined;
  }

  function formatShippingAddress(order) {
    var a = shippingField(order, ['address', 'shipping_address', 'street', 'address1']);
    var c = shippingField(order, ['city', 'shipping_city', 'town']);
    var s = shippingField(order, ['state', 'shipping_state', 'region']);
    var p = shippingField(order, ['pincode', 'shipping_pincode', 'zip', 'postal_code']);
    var parts = [a, c, s, p].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  }

  function showNotFound() {
    orderNumberEl.textContent = '—';
    orderNameEl.textContent = '—';
    confirmItemsEl.innerHTML = '<tr><td colspan="3">No order found.</td></tr>';
    confirmSubtotalEl.textContent = '—';
    confirmShippingEl.textContent = '—';
    confirmTotalEl.textContent = '—';
    confirmAddressEl.textContent = '—';
    confirmCityEl.textContent = '—';
    confirmDeliveryEl.innerHTML =
      'We couldn’t find an order with that number. <a href="index.html">Return to shop</a>';
  }

  if (!id) {
    showNotFound();
    return;
  }

  const orders = loadOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    showNotFound();
    return;
  }

  orderNumberEl.textContent = order.id;
  orderNameEl.textContent = order.contact.name;

  let itemsHtml = '';
  order.items.forEach(item => {
    itemsHtml += '<tr>' +
      '<td>' + escapeHtml(item.color) + (item.lidPack ? ' + Lid pack' : '') + '</td>' +
      '<td>' + item.qty + '</td>' +
      '<td>' + formatINR(item.unit * item.qty) + '</td>' +
      '</tr>';
  });
  confirmItemsEl.innerHTML = itemsHtml;

  confirmSubtotalEl.textContent = formatINR(order.subtotal);
  confirmShippingEl.textContent = order.shipping === 0 ? 'Free' : formatINR(order.shipping);
  confirmTotalEl.textContent = formatINR(order.total);

  confirmAddressEl.textContent = formatShippingAddress(order);
  confirmCityEl.textContent = shippingField(order, ['city', 'shipping_city', 'town']) || '—';

  // Estimated delivery: 5-7 days from order date
  const orderDate = new Date(order.date);
  const delivery = new Date(orderDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  confirmDeliveryEl.textContent = 'Estimated delivery: ' + delivery.toLocaleDateString('en-IN', options);

  function escapeHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});