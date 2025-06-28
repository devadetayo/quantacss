document.addEventListener('DOMContentLoaded', () => {
  const handle    = document.getElementById('theme-handle');
  const wrapper   = handle.parentElement;
  const darkPanel = wrapper.querySelector('[data-theme="dark"]');

  let isDragging = false;

  const stopDrag = () => {
    isDragging = false;
    handle.style.transition    = '';
    darkPanel.style.transition = '';
  };

  const startDrag = e => {
    e.preventDefault();
    isDragging = true;
    handle.setPointerCapture(e.pointerId);
    handle.style.transition    = 'none';
    darkPanel.style.transition = 'none';
  };

  const onDrag = e => {
    if (!isDragging) return;
    const rect = wrapper.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));
    const pct = (x / rect.width) * 100;
    handle.style.left        = `${pct}%`;
    darkPanel.style.clipPath = `inset(0 0 0 ${pct}%)`;
  };

  handle.addEventListener('pointerdown', startDrag);
  document.addEventListener('pointermove', onDrag);
  handle.addEventListener('pointerup',   stopDrag);
  handle.addEventListener('pointerleave',stopDrag);
});