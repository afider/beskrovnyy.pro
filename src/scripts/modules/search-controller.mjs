export function createSearchController({ loadPagefind, render }) {
  let pagefindPromise;
  let requestId = 0;

  function reset() {
    requestId++;
    render({ status: 'idle', results: [] });
  }

  async function search(value) {
    const query = value.trim();
    if (!query) {
      reset();
      return;
    }

    const currentRequest = ++requestId;
    render({ status: 'loading', results: [] });
    let pagefind;

    try {
      pagefindPromise ??= Promise.resolve().then(loadPagefind).catch((error) => {
        pagefindPromise = undefined;
        throw error;
      });
      pagefind = await pagefindPromise;
      if (currentRequest !== requestId) return;

      const response = await pagefind.search(query);
      if (currentRequest !== requestId) return;

      const results = await Promise.all(response.results.map((result) => result.data()));
      if (currentRequest !== requestId) return;

      render({ status: results.length ? 'results' : 'empty', results });
    } catch {
      if (currentRequest !== requestId) return;

      // Pagefind retains initialization errors, so a retry needs a fresh instance.
      pagefindPromise = undefined;
      try {
        await pagefind?.destroy?.();
      } catch {
        // Cleanup failure must not prevent retrying with a new instance.
      }
      if (currentRequest === requestId) {
        render({ status: 'error', results: [] });
      }
    }
  }

  return { search, reset };
}
