import { createSearchController } from './search-controller.mjs';

export default function initSearch() {
  const input = document.querySelector('#search');
  if (!input) return;

  const clearButton = document.querySelector('#search-clear');
  const retryButton = document.querySelector('#search-retry');
  const title = document.querySelector('#search-title');
  const results = document.querySelector('#search-results');
  const page = document.documentElement;
  const pagefindUrl = '/pagefind/pagefind.js';
  let scrollPosition = null;

  const messages = {
    idle: '',
    loading: 'Ищем…',
    results: 'Вот, что нашлось:',
    empty: 'По такому запросу ничего нет 😥',
    error: 'Не удалось выполнить поиск. Попробуйте ещё раз.',
  };

  const controller = createSearchController({
    loadPagefind: async () => {
      const pagefind = await import(/* @vite-ignore */ pagefindUrl);
      return pagefind.createInstance();
    },
    render({ status, results: matches }) {
      const active = status !== 'idle';
      if (active && scrollPosition === null) scrollPosition = window.scrollY;
      page.classList.toggle('_locked', active);
      page.classList.toggle('_search', active);
      if (!active && scrollPosition !== null) {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
        scrollPosition = null;
      }

      title.textContent = messages[status];
      retryButton.hidden = status !== 'error';
      results.setAttribute('aria-busy', String(status === 'loading'));

      const fragment = document.createDocumentFragment();
      for (const data of matches) {
        const link = document.createElement('a');
        link.className = 'results__item';
        link.href = data.url;
        const heading = document.createElement('h3');
        heading.className = 'results__title';
        heading.textContent = data.meta.title;
        const excerpt = document.createElement('p');
        excerpt.className = 'results__text';
        // Pagefind produces highlighted HTML from the site's own search index.
        excerpt.innerHTML = data.excerpt;
        link.append(heading, excerpt);
        fragment.append(link);
      }
      results.replaceChildren(fragment);
    },
  });

  function resetSearch() {
    input.value = '';
    controller.reset();
  }

  input.addEventListener('input', () => controller.search(input.value));
  retryButton.addEventListener('click', () => controller.search(input.value));
  clearButton.addEventListener('click', () => {
    resetSearch();
    input.focus();
  });

  return resetSearch;
}
