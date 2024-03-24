export default function switchNavbar() {
  const navbar = document.querySelectorAll('[data-navbar]');
  const navbarButtons = document.querySelectorAll('[data-navbar-target]');
  const navbarSections = document.querySelectorAll('[data-navbar-section]');
  const activeState = '_active';

  if (!navbar) return;

  navbarButtons.forEach(function(button){
    button.addEventListener('click', function(curButton) {

      curButton.target.classList.toggle(activeState);

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
    })

  })
  
}
