export default function switchNavbar({ onSearchClose = () => {} } = {}) {
  const navbar = document.querySelector('[data-navbar]');
  if (!navbar) return;

  const navbarButtons = document.querySelectorAll('[data-navbar-target]');
  const navbarSections = document.querySelectorAll('[data-navbar-section]');
  const closeButtons = document.querySelectorAll('[data-navbar-close]');
  const searchSection = document.querySelector('[data-navbar-section="search-section"]');
  const activeState = '_active';
  let focusTimer;

  function setActiveSection(sectionName) {
    clearTimeout(focusTimer);

    navbarButtons.forEach((button) => {
      button.classList.toggle(activeState, button.getAttribute('data-navbar-target') === sectionName);
    });
    navbarSections.forEach((section) => {
      section.classList.toggle(activeState, section.getAttribute('data-navbar-section') === sectionName);
    });
    navbar.classList.toggle(activeState, Boolean(sectionName));

    if (sectionName === 'search-section') {
      focusTimer = setTimeout(() => {
        if (searchSection?.classList.contains(activeState)) {
          document.getElementById('search')?.focus();
        }
      }, 600);
    } else {
      onSearchClose();
    }
  }

  closeButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveSection(null));
  });

  navbarButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const sectionName = button.classList.contains(activeState)
        ? null
        : button.getAttribute('data-navbar-target');
      setActiveSection(sectionName);
    });
  });
}
