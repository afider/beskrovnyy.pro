export default function switchTheme() {
  const inputs = document.querySelectorAll('[data-theme-input]');
  const pictures = document.querySelectorAll('[data-theme-img]');
  const doc = document.getElementsByTagName("html")[0];
  const themeState = '_THEME-DARK';
  const mediaDark = '(prefers-color-scheme: dark)';
  const mediaLight = '(prefers-color-scheme: light)';

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
  .matchMedia(mediaDark)
  .addEventListener('change', () => {
    getTheme();
    getOsTheme();

    if (theme === 'system') {
      getOsTheme();
      setThemeState(theme);
    }

    // stay dark if theme has been set by the user
    if (theme === 'dark' && themeOs === 'dark' && getDarkSourceMedia(pictures) === 'light') {
      reverseImgMedia(pictures);
    } else if (theme === 'dark' && themeOs === 'light' && getDarkSourceMedia(pictures) === 'dark') {
      reverseImgMedia(pictures);
    }

    // stay light if theme has been set by the user
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
        doc.classList.remove('_THEME-SYSTEM');
        doc.classList.remove('_THEME-LIGHT');
        doc.classList.add('_THEME-DARK');
      break
      case 'system':
        doc.classList.add('_THEME-SYSTEM');
        if (themeOs === 'dark') {
          doc.classList.remove('_THEME-LIGHT');
          doc.classList.add('_THEME-DARK');
        } else if (themeOs === 'light') {
          doc.classList.remove('_THEME-DARK');
          doc.classList.add('_THEME-LIGHT');
        } else {
          doc.classList.remove('_THEME-LIGHT');
          doc.classList.remove('_THEME-DARK');
        }
        break
      case 'light':
        doc.classList.remove('_THEME-SYSTEM');
        doc.classList.remove('_THEME-DARK');
        doc.classList.add('_THEME-LIGHT');
      default:
        doc.classList.remove('_THEME-SYSTEM');
        doc.classList.remove('_THEME-DARK');
        doc.classList.add('_THEME-LIGHT');
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

    if (window.matchMedia && window.matchMedia(mediaDark).matches) {
      themeOs = 'dark';
    } else {
      themeOs = 'light';
    }
  }

  function setImgTheme(theme) {
    // sets media attributes to the image depending on the selected theme

    switch(theme) {
      case 'dark':
        if (themeOs === 'dark' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } else if (themeOs === 'light' && getDarkSourceMedia(pictures) === 'dark') {
          reverseImgMedia(pictures);
        }
      break
      case 'light':
        if (themeOs === 'light' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } else if (themeOs === 'dark' && getDarkSourceMedia(pictures) === 'dark') {
          reverseImgMedia(pictures);
        } 
      break
      default:
        if (themeOs === 'dark' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } else if (themeOs === 'light' && getDarkSourceMedia(pictures) === 'light') {
          reverseImgMedia(pictures);
        } 
    }
  }

  function getDarkSourceMedia(pictures) {
    // gets the media attribute value from one of the sources for a dark theme

    const sourceDarkAtt = pictures[0].querySelector('[data-dark]').getAttribute('media');

    if (sourceDarkAtt === mediaDark) {
      return 'dark';
    } else {
      return 'light';
    }
  }

  function reverseImgMedia(pictures) {
    // sets the media attribute to the opposite value

    pictures.forEach((el) => {
      const sources = el.querySelectorAll('source');

      sources.forEach((el) => {

        if (el.getAttribute('media') === mediaDark) {
          el.setAttribute('media', mediaLight);
        } else {
          el.setAttribute('media', mediaDark);
        }
      })
    })
  }
}