document.addEventListener('DOMContentLoaded', () => {
  // ─── Mobile “hamburger” → #mobile-menu ──────────────────────────────
  const navBtn = document.querySelector('button[data-toggle][data-target="#mobile-menu"]');
  const mobileMenu = document.getElementById('mobile-menu');

  // SVG icons
  const hamSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18" fill="currentColor"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>`;
  const closeSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="18" height="18" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;

  // initialize
  navBtn.innerHTML = hamSVG;

  navBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    navBtn.innerHTML = isOpen ? closeSVG : hamSVG;
  });

  // ─── Docs sidebar toggle → #docs-sidebar ─────────────────────────────
  const sideBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('docs-sidebar');

  sideBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
});

document.querySelectorAll('.toggle-more').forEach((btn) => {
  const targetId = btn.getAttribute('data-target');
  const section = document.querySelector(`#${targetId}`);

  if (!section) return;

  btn.addEventListener('click', () => {
    const isCollapsed = section.classList.toggle('collapsed');
    btn.textContent = isCollapsed ? 'Show more' : 'Show less';
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const tocLinks = Array.from(document.querySelectorAll(".toc-link"));
  const sections = tocLinks.map(link =>
    document.getElementById(link.getAttribute("href").slice(1))
  );

  const onScroll = () => {
    const scrollPos = window.scrollY + 120; // 120px offset for header/padding
    sections.forEach((sec, idx) => {
      if (!sec) return;
      const top    = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        tocLinks.forEach(l => l.classList.remove("active"));
        tocLinks[idx].classList.add("active");
      }
    });
  };

  window.addEventListener("scroll", onScroll);
  onScroll(); // initialize on load
});