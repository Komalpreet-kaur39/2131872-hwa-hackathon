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

  const form = document.getElementById('lookup-form');
  const resultEl = document.getElementById('lookup-result');
  const resultTitle = document.getElementById('result-title');
  const resultNumber = document.getElementById('result-number');
  const resultName = document.getElementById('result-name');
  const resultTotal = document.getElementById('result-total');
  const resultAddress = document.getElementById('result-address');
  const resultDelivery = document.getElementById('result-delivery');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const orderNum = document.getElementById('lookup-order').value.trim();
    const email = document.getElementById('lookup-email').value.trim().toLowerCase();

    const orders = loadOrders();
    const order = orders.find(o => o.id.toLowerCase() === orderNum.toLowerCase() && o.contact.email.toLowerCase() === email);

    if (!order) {
      resultEl.className = 'order-result notfound';
      resultEl.style.display = 'block';
      resultTitle.textContent = 'Order not found';
      resultNumber.textContent = '';
      resultName.textContent = '';
      resultTotal.textContent = '';
      resultAddress.textContent = '';
      resultDelivery.textContent = 'We couldn’t find an order matching that number and email. Please check and try again.';
      return;
    }

    resultEl.className = 'order-result found';
    resultEl.style.display = 'block';
    resultTitle.textContent = 'Order found';
    resultNumber.textContent = 'Order #' + order.id;
    resultName.textContent = 'Customer: ' + order.contact.name;
    resultTotal.textContent = 'Total: ' + formatINR(order.total);
    resultAddress.textContent = formatShippingAddress(order);

    const orderDate = new Date(order.date);
    const delivery = new Date(orderDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    resultDelivery.textContent = 'Estimated delivery: ' + delivery.toLocaleDateString('en-IN', options);
  });
});