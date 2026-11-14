(() => {
  'use strict';
  document.getElementById('year').textContent = new Date().getFullYear();
  const dialog = document.getElementById('healthbot-dialog');
  const image = document.getElementById('healthbot-large');
  document.getElementById('open-healthbot').addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.querySelectorAll('[data-shot]').forEach(button => {
    button.addEventListener('click', () => {
      dialog.querySelectorAll('[data-shot]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      const detail = button.dataset.shot === 'detail';
      image.src = `assets/healthbot-${detail ? 'detail' : 'dashboard'}.webp`;
      document.getElementById('fullsize-shot').href = image.src;
      image.alt = detail ? 'Health Bot patient view with sample appointments and a fictional e-diary entry' : 'Health Bot admin dashboard with fictional sample patients';
    });
  });
})();
