document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('order-form');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    btn.textContent = 'Joining waitlist...';
    btn.disabled = true;

    // Simulate form submission
    setTimeout(function() {
      btn.textContent = 'Joined!';
      btn.style.background = 'var(--success)';
      form.reset();

      setTimeout(function() {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 2000);
    }, 1200);
  });
});