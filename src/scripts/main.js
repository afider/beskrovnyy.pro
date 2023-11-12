import switchTheme from '@js/modules/theme';
import copy from '@js/modules/copy';
import setContentsActiveState from '@js/modules/contents';

onload = () => {
  // ставим   scroll-behavior: smooth; только, когда загрузилась страница, а не готов документ, чтобы пользователи, у которых загрузился только документ уже смогли перейти по якорю
  document.documentElement.style.scrollBehavior = "smooth";
};

switchTheme();
copy();
setContentsActiveState();
