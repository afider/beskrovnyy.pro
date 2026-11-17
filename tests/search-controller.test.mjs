import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createSearchController } from '../src/scripts/modules/search-controller.mjs';

const deferred = () => Promise.withResolvers();
const row = (title) => ({ url: `/${title}/`, meta: { title }, excerpt: title });
const response = (...rows) => ({ results: rows.map((data) => ({ data: async () => data })) });

function setup(loadPagefind) {
  const states = [];
  const controller = createSearchController({
    loadPagefind,
    render: (state) => states.push({ status: state.status, results: [...state.results] }),
  });
  return { ...controller, states, latest: () => states.at(-1) };
}

test('empty and whitespace input clears immediately without loading Pagefind', async () => {
  let loads = 0;
  const search = setup(async () => {
    loads++;
    throw new Error('Empty input must not load Pagefind');
  });

  for (const value of ['', '   ', '\n\t']) {
    const pending = search.search(value);
    assert.deepEqual(search.latest(), { status: 'idle', results: [] });
    await pending;
  }
  assert.equal(loads, 0);
});

test('rapid typing shares one pending import and searches the latest trimmed query', async () => {
  const loading = deferred();
  const queries = [];
  let loads = 0;
  const search = setup(() => {
    loads++;
    return loading.promise;
  });
  const first = search.search(' first ');
  const latest = search.search(' second ');
  await setImmediate();
  assert.equal(loads, 1);
  assert.deepEqual(search.latest(), { status: 'loading', results: [] });

  loading.resolve({ search: async (query) => {
    queries.push(query);
    return response(row(query));
  } });
  await Promise.all([first, latest]);
  assert.deepEqual(queries, ['second']);
  assert.deepEqual(search.latest(), { status: 'results', results: [row('second')] });

  await search.search('third');
  assert.equal(loads, 1);
  assert.deepEqual(search.latest().results, [row('third')]);
});

test('an older search response cannot overwrite the latest results', async () => {
  const older = deferred();
  const newer = deferred();
  const search = setup(async () => ({
    search: (query) => query === 'older' ? older.promise : newer.promise,
  }));
  const oldRequest = search.search('older');
  await setImmediate();
  const newRequest = search.search('newer');
  await setImmediate();

  newer.resolve(response(row('newer')));
  await newRequest;
  const rendered = search.states.length;
  older.resolve(response(row('older')));
  await oldRequest;
  assert.equal(search.states.length, rendered);
  assert.deepEqual(search.latest(), { status: 'results', results: [row('newer')] });
});

test('late result data cannot append to a newer result set', async () => {
  const olderData = deferred();
  const search = setup(async () => ({
    search: async (query) => query === 'older'
      ? { results: [{ data: () => olderData.promise }] }
      : response(row('newer')),
  }));
  const oldRequest = search.search('older');
  await setImmediate();
  await search.search('newer');
  const rendered = search.states.length;
  olderData.resolve(row('older'));
  await oldRequest;
  assert.equal(search.states.length, rendered);
  assert.deepEqual(search.latest().results, [row('newer')]);
});

test('result data renders atomically in search rank order', async () => {
  const first = deferred();
  const second = deferred();
  const search = setup(async () => ({
    search: async () => ({ results: [first, second].map((pending) => ({ data: () => pending.promise })) }),
  }));
  const pending = search.search('ranked');
  await setImmediate();
  second.resolve(row('second'));
  await setImmediate();
  assert.deepEqual(search.latest(), { status: 'loading', results: [] });
  first.resolve(row('first'));
  await pending;
  assert.deepEqual(search.latest(), { status: 'results', results: [row('first'), row('second')] });
  assert.equal(search.states.filter((state) => state.status === 'results').length, 1);
});

for (const phase of ['import', 'search', 'data']) {
  for (const action of ['clear', 'reset']) {
    test(`${action} during ${phase} invalidates pending work and allows a fresh search`, async () => {
      const waiting = deferred();
      const pagefind = {
        search: async (query) => {
          if (query !== 'old') return response(row(query));
          if (phase === 'search') return waiting.promise;
          if (phase === 'data') return { results: [{ data: () => waiting.promise }] };
          return response(row('old'));
        },
      };
      const search = setup(() => phase === 'import' ? waiting.promise : Promise.resolve(pagefind));
      const pending = search.search('old');
      await setImmediate();

      const clearing = action === 'reset' ? search.reset() : search.search('');
      assert.deepEqual(search.latest(), { status: 'idle', results: [] });
      const rendered = search.states.length;
      waiting.resolve(phase === 'import' ? pagefind : phase === 'search' ? response(row('old')) : row('old'));
      await Promise.all([pending, clearing]);
      assert.equal(search.states.length, rendered);
      assert.deepEqual(search.latest(), { status: 'idle', results: [] });

      await search.search('reopened');
      assert.deepEqual(search.latest(), { status: 'results', results: [row('reopened')] });
    });
  }
}

test('a rejected import shows an error and retries loading on the next query', async () => {
  let loads = 0;
  const search = setup(async () => {
    if (++loads === 1) throw new Error('Import failed');
    return { search: async (query) => response(row(query)) };
  });
  await search.search('first');
  assert.deepEqual(search.latest(), { status: 'error', results: [] });
  await search.search('retry');
  assert.equal(loads, 2);
  assert.deepEqual(search.latest(), { status: 'results', results: [row('retry')] });
});

test('an import failure after reset stays hidden and a reopened search can retry', async () => {
  const loading = deferred();
  let loads = 0;
  const search = setup(() => ++loads === 1
    ? loading.promise
    : Promise.resolve({ search: async (query) => response(row(query)) }));
  const pending = search.search('old');
  await setImmediate();
  search.reset();
  const rendered = search.states.length;
  loading.reject(new Error('Late import failure'));
  await pending;
  assert.equal(search.states.length, rendered);
  assert.deepEqual(search.latest(), { status: 'idle', results: [] });
  await search.search('reopened');
  assert.equal(loads, 2);
  assert.deepEqual(search.latest(), { status: 'results', results: [row('reopened')] });
});

for (const phase of ['search', 'data']) {
  test(`a rejected ${phase} shows an error and the next query succeeds`, async () => {
    let loads = 0;
    const search = setup(async () => {
      loads++;
      return { search: async (query) => {
        if (query !== 'bad') return response(row(query));
        if (phase === 'search') throw new Error('Search failed');
        return { results: [{ data: async () => { throw new Error('Data failed'); } }] };
      } };
    });
    await search.search('bad');
    assert.deepEqual(search.latest(), { status: 'error', results: [] });
    await search.search('retry');
    assert.equal(loads, 2);
    assert.deepEqual(search.latest(), { status: 'results', results: [row('retry')] });
  });

  test(`a stale ${phase} failure cannot replace newer results with an error`, async () => {
    const waiting = deferred();
    const search = setup(async () => ({
      search: async (query) => {
        if (query !== 'old') return response(row(query));
        if (phase === 'search') return waiting.promise;
        return { results: [{ data: () => waiting.promise }] };
      },
    }));
    const oldRequest = search.search('old');
    await setImmediate();
    await search.search('new');
    const rendered = search.states.length;
    waiting.reject(new Error('Late failure'));
    await oldRequest;
    assert.equal(search.states.length, rendered);
    assert.deepEqual(search.latest(), { status: 'results', results: [row('new')] });
  });
}

test('no matches clears previous results and renders the empty state', async () => {
  const search = setup(async () => ({
    search: async (query) => query === 'missing' ? response() : response(row(query)),
  }));
  await search.search('found');
  assert.deepEqual(search.latest().results, [row('found')]);
  await search.search('missing');
  assert.deepEqual(search.latest(), { status: 'empty', results: [] });
});

test('retry replaces an instance with a persistent initialization error even if disposal fails', async () => {
  let loads = 0;
  let disposals = 0;
  const search = setup(async () => ++loads === 1 ? {
    search: async () => { throw new Error('Cached initialization failure'); },
    destroy: async () => {
      disposals++;
      throw new Error('Disposal failed');
    },
  } : { search: async (query) => response(row(query)) });
  await search.search('first');
  assert.deepEqual(search.latest(), { status: 'error', results: [] });
  await search.search('retry');
  assert.equal(disposals, 1);
  assert.equal(loads, 2);
  assert.deepEqual(search.latest(), { status: 'results', results: [row('retry')] });
});

test('slow disposal of a failed instance cannot reset a newer successful search', async () => {
  const disposing = deferred();
  let loads = 0;
  const search = setup(async () => ++loads === 1 ? {
    search: async () => { throw new Error('Initialization failed'); },
    destroy: () => disposing.promise,
  } : { search: async (query) => response(row(query)) });
  const oldRequest = search.search('old');
  await setImmediate();
  await search.search('new');
  assert.deepEqual(search.latest(), { status: 'results', results: [row('new')] });
  const rendered = search.states.length;
  disposing.resolve();
  await oldRequest;
  assert.equal(search.states.length, rendered);
});
