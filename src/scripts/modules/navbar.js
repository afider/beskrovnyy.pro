export default function switchNavbar() {
  const navbar = document.querySelector('[data-navbar]');
  const navbarButtons = document.querySelectorAll('[data-navbar-target]');
  const navbarSections = document.querySelectorAll('[data-navbar-section]');
  const closeButtons = document.querySelectorAll('[data-navbar-close]');
  const activeState = '_active';
  let isModal = false;

  if (!navbar) return;

  closeButtons.forEach(function(button) {
    button.addEventListener('click', function() {

      navbarButtons.forEach(function(el) {
        el.classList.remove(activeState);
        
      });
  
      navbarSections.forEach(function(el) {
        el.classList.remove(activeState);
      });

      checkIsModal();
    });
  });

  navbarButtons.forEach(function(button){
    button.addEventListener('click', function(curButton) {

      curButton.target.closest('button').classList.toggle(activeState);

      console.log('curButton.target ', curButton.target.closest('button').classList);
      console.log('curButton ', curButton);

      navbarButtons.forEach(function(el) {
        if(curButton.target.getAttribute('data-navbar-target') !== el.getAttribute('data-navbar-target')) {
          el.classList.remove(activeState);
        }
      });

      navbarSections.forEach(function(el) {
        if(curButton.target.getAttribute('data-navbar-target') !== el.getAttribute('data-navbar-section')) {
          console.log('!curButton');
          el.classList.remove(activeState);
        }
      });

      document.querySelector(`[data-navbar-section="${curButton.target.getAttribute('data-navbar-target')}"]`).classList.toggle(activeState);

      checkIsModal();
    })
  })

  function checkIsModal() {
    isModal = false;

      navbarButtons.forEach(function(el) {
        if (el.classList.contains(activeState)) {
          isModal = true;
        }
      });

      if (isModal) {
        navbar.classList.add(activeState);
      } else {
        navbar.classList.remove(activeState);
      }
  }
}
