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

  function getField(obj, key) {
    if (!obj) return null;
    var v = obj[key];
    return v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : null;
  }

  function formatAddressLine(order) {
    var contact = order && order.contact;
    var shipping = order && order.shipping;
    var name = getField(contact, 'name');
    var address = getField(shipping, 'address');
    var city = getField(shipping, 'city');
    var state = getField(shipping, 'state');
    var pincode = getField(shipping, 'pincode');
    var statePin = [state, pincode].filter(Boolean).join(' ');
    var parts = [name, address, city, statePin].filter(Boolean);
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

  orderNumberEl.textContent = getField(order, 'id') || '—';
  orderNameEl.textContent = getField(order.contact, 'name') || '—';

  let itemsHtml = '';
  var items = order && order.items ? order.items : [];
  items.forEach(function(item) {
    var color = getField(item, 'color') || '—';
    var lid = getField(item, 'lidPack') ? ' + Lid pack' : '';
    var qty = getField(item, 'qty') || '—';
    var unit = getField(item, 'unit');
    var itemTotal = unit ? formatINR(parseInt(unit) * parseInt(qty)) : '—';
    itemsHtml += '<tr>' +
      '<td>' + escapeHtml(color) + lid + '</td>' +
      '<td>' + escapeHtml(qty) + '</td>' +
      '<td>' + escapeHtml(itemTotal) + '</td>' +
      '</tr>';
  });
  confirmItemsEl.innerHTML = itemsHtml;

  var subtotal = getField(order, 'subtotal');
  var shipping = getField(order, 'shipping');
  var total = getField(order, 'total');
  confirmSubtotalEl.textContent = subtotal ? formatINR(parseInt(subtotal)) : '—';
  confirmShippingEl.textContent = shipping !== null && shipping !== undefined ? (parseInt(shipping) === 0 ? 'Free' : formatINR(parseInt(shipping))) : '—';
  confirmTotalEl.textContent = total ? formatINR(parseInt(total)) : '—';

  confirmAddressEl.textContent = formatAddressLine(order);
  confirmCityEl.textContent = '';

  var email = getField(order.contact, 'email');
  var phone = getField(order.contact, 'phone');
  var contactParts = [email, phone].filter(Boolean);
  if (contactParts.length) {
    var contactEl = document.createElement('p');
    contactEl.textContent = contactParts.join(', ');
    confirmAddressEl.parentNode.insertBefore(contactEl, confirmCityEl);
  }

  // Estimated delivery: 5-7 days from order date
  const orderDate = new Date(order.date);
  const delivery = new Date(orderDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  confirmDeliveryEl.textContent = 'Estimated delivery: ' + delivery.toLocaleDateString('en-IN', options);

  function escapeHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});