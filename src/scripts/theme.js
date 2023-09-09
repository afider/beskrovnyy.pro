export default function switchTheme() {
  const inputs = document.querySelectorAll('[data-theme-input]');
  const doc = document.getElementsByTagName("html")[0];
  const themeState = '_THEME-DARK';

  if(!inputs) {
    return;
  }

  let theme;
  let themeOs;

  getTheme();
  getOsTheme();
  setThemeState(theme);
  setSwitcherState(theme);
  selectTheme();

  // устанавливает системную тему, если в Local Storage не было сохранено никакой темы принудительно
  window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    getTheme();

    if (theme === 'system') {
      getOsTheme();
      setThemeState(theme);
    }
  })

  function selectTheme() {
    // устанавливает цветовую тему в зависиомсти от системной темы и сохраненного значения темы в Local Storage
    inputs.forEach((el) => {
      el.addEventListener('change', (el) => {
        const theme = el.target.value;

        getOsTheme();
        setThemeState(theme);
        saveTheme(theme);
      });
    });
  }

  function setSwitcherState(theme) {
    // устанавливает радиокнопкам переключателя атрибут checked, если радиокнопка выбрана
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
    // устанавливаем элементу HTML глобальный селектор состояния, определяющий текущую цветовую схему
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
    // сохраняем в Local Storage значение темы: light, system или dark в поле theme
    localStorage.setItem('theme', theme);
  }

  function getTheme() {
    // записываем в переменную theme, сохраненное в Local Storage значение темы: light, system или dark
    theme = localStorage.getItem('theme');
  }

  function getOsTheme() {
    // записываем в переменную themeOS, текущую цветовую тему, установленную в системе
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeOs = 'dark';
    } else {
      themeOs = 'light';
    }
  }
}