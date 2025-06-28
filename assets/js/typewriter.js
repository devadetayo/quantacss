// typewriter.js
document.addEventListener('DOMContentLoaded', () => {
  const span = document.querySelector('.typing-animation');
  const text = 'no code‑burst.';
  let idx = 0, forward = true;

  function tick() {
    span.textContent = text.slice(0, idx);
    if (forward) {
      idx++;
      if (idx > text.length) {
        forward = false;
        return setTimeout(tick, 1000); // pause at end
      }
    } else {
      idx--;
      if (idx < 0) {
        forward = true;
        return setTimeout(tick, 500); // pause at start
      }
    }
    setTimeout(tick, 100); // typing speed
  }

  // add caret style
  span.style.borderRight = '.15em solid currentColor';
  tick();
});
