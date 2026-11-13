export function initializeMobileNavigation() {
  const menu = document.querySelector('.mobile-nav');
  const summary = menu.querySelector('summary');
  const links = menu.querySelector('.dropdown-links');
  const content = document.querySelector('.page-shell');
  const mobile = matchMedia('(max-width: 760px)');
  content.before(menu);
  links.setAttribute('role', 'navigation');
  links.setAttribute('aria-label', 'Menu mobilne');

  function updateMenu() {
    const open = menu.open && mobile.matches;
    document.documentElement.classList.toggle('menu-open', open);
    content.inert = open;
    summary.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    summary.setAttribute('aria-expanded', String(open));
  }

  function closeMenu() {
    menu.open = false;
    updateMenu();
  }

  menu.addEventListener('toggle', updateMenu);
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  mobile.addEventListener('change', () => {
    closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (!menu.open) return;
    if (event.key === 'Escape') {
      closeMenu();
      summary.focus();
    }
    if (event.key === 'Tab') {
      const lastLink = links.lastElementChild;
      if (event.shiftKey && document.activeElement === summary) {
        event.preventDefault();
        lastLink.focus();
      } else if (!event.shiftKey && document.activeElement === lastLink) {
        event.preventDefault();
        summary.focus();
      }
    }
  });
  updateMenu();
}
