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

  if (!id) {
    orderNumberEl.textContent = '—';
    orderNameEl.textContent = 'customer';
    confirmDeliveryEl.textContent = 'No order found.';
    return;
  }

  const orders = loadOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    orderNumberEl.textContent = id;
    orderNameEl.textContent = 'customer';
    confirmDeliveryEl.textContent = 'Order not found.';
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

  confirmAddressEl.textContent = order.shipping.address + ', ' + order.shipping.city + ', ' + order.shipping.state + ' ' + order.shipping.pincode;
  confirmCityEl.textContent = order.shipping.city;

  // Estimated delivery: 5-7 days from order date
  const orderDate = new Date(order.date);
  const delivery = new Date(orderDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  confirmDeliveryEl.textContent = 'Estimated delivery: ' + delivery.toLocaleDateString('en-IN', options);

  function escapeHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});