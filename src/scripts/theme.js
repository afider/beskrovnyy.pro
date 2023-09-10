export default function switchTheme() {
  const inputs = document.querySelectorAll('[data-theme-input]');
  const doc = document.getElementsByTagName("html")[0];
  const themeState = '_THEME-DARK';

  // Variables for theme images
  const pictures = document.querySelectorAll('[data-theme-img]');

  if(!inputs) {
    return;
  }

  let theme;
  let themeOs;

  getTheme();
  getOsTheme();
  setThemeState(theme);
  setImgTheme(theme);
  setSwitcherState(theme);
  selectTheme();

  // sets the system theme if no theme has been saved in Local Storage
  window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    getTheme();
    getOsTheme();

    if (theme === 'system') {
      getOsTheme();
      setThemeState(theme);
    }

    // Stay dark if theme has been set by the user
    if (theme === 'dark' && themeOs === 'dark' && getDarkSourceMedia(pictures) === 'light') {
      reverseImgMedia(pictures);
    } else if (theme === 'dark' && themeOs === 'light' && getDarkSourceMedia(pictures) === 'dark') {
      reverseImgMedia(pictures);
    }

    // Stay light if theme has been set by the user
    if (theme === 'light' && themeOs === 'light' && getDarkSourceMedia(pictures) === 'light') {
      reverseImgMedia(pictures);
    } else if (theme === 'light' && themeOs === 'dark' && getDarkSourceMedia(pictures) === 'dark') {
      reverseImgMedia(pictures);
    }
  })

  function selectTheme() {
    // sets the color theme depending on the system theme and the saved theme value in Local Storage
    inputs.forEach((el) => {
      el.addEventListener('change', (el) => {
        const theme = el.target.value;

        getOsTheme();
        setThemeState(theme);
        saveTheme(theme);
        setImgTheme(theme);
      });
    });
  }

  function setSwitcherState(theme) {
    // sets the checked attribute to the radio buttons of the radio button, if the radio button is selected
    if (!theme) {
      return;
    }

    inputs.forEach((el) => {
      if (el.value === theme) {
        el.setAttribute('checked', 'checked');
      } else if (!theme) {
        el.removeAttribute('checked');
      }
    });
  }

  function setThemeState(theme) {
    // sets a global status selector for the HTML element that defines the current color scheme
    switch(theme) {
      case 'dark':
        doc.classList.add(themeState);
      break
      case 'system':
        if (themeOs === 'dark') {
          doc.classList.add(themeState);
        } else {
          doc.classList.remove(themeState);
        }
        break
      case 'light':
        doc.classList.remove(themeState);
      default:
        doc.classList.remove(themeState);
    }
  }

  function saveTheme(theme) {
    // saves the theme value: light, system or dark in the theme field in localStorage
    localStorage.setItem('theme', theme);
  }

  function getTheme() {
    // saves the theme value: light, system, or dark to the theme variable from localStorage
    theme = localStorage.getItem('theme');
  }

  function getOsTheme() {
    // saves the current system color scheme to the themeOS variable
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeOs = 'dark';
    } else {
      themeOs = 'light';
    }
  }

  function setImgTheme(theme) {
    switch(theme) {
      case 'dark':
        if (themeOs === 'dark' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } else if (themeOs === 'light' && getDarkSourceMedia(pictures) === 'dark') {
          reverseImgMedia(pictures);
        }
      break
      case 'system':
        if (themeOs === 'dark' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } else if (themeOs === 'light' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } 
        break
      case 'light':
        if (themeOs === 'light' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } else if (themeOs === 'dark' && getDarkSourceMedia(pictures) === 'dark') {
          reverseImgMedia(pictures);
        } 
      default:
        console.log('default');
    }
  }

  function getDarkSourceMedia(pictures) {
    const sourceDarkAtt = pictures[0].querySelector('[data-dark]').getAttribute('media');

    if (sourceDarkAtt === '(prefers-color-scheme: dark)') {
      console.log('dark');
      return 'dark';
    } else {
      console.log('light');
      return 'light';
    }
  }

  function reverseImgMedia(pictures) {
    
    pictures.forEach((el) => {
      const sources = el.querySelectorAll('source');

      sources.forEach((el) => {

        if (el.getAttribute('media') === '(prefers-color-scheme: dark)') {
          el.setAttribute('media', '(prefers-color-scheme: light)');
        } else {
          el.setAttribute('media', '(prefers-color-scheme: dark)');
        }
      })
    })
  }
}