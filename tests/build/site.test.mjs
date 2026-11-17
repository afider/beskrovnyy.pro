import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';
import sharp from 'sharp';

// BUILD_DIR also allows testing a deliberately damaged copy without touching dist.
const buildDir = path.resolve(process.env.BUILD_DIR || fileURLToPath(new URL('../../dist/', import.meta.url)));
const origin = 'https://beskrovnyy.pro';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(filename) : filename;
  }))).flat();
}

function descendants(node) {
  return [node, ...(node.childNodes || []).flatMap(descendants)];
}

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') || '').split(/\s+/).includes(name);
const text = node => (node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(''));
const normalizedText = node => text(node).replace(/\s+/gu, ' ').trim();
const urlFor = filename => new URL('/' + path.relative(buildDir, filename).split(path.sep).join('/').replace(/index\.html$/, ''), origin);
const files = await filesIn(buildDir);
const pages = new Map(await Promise.all(files.filter(filename => filename.endsWith('.html')).map(async filename => {
  const nodes = descendants(parse(await readFile(filename, 'utf8')));
  return [filename, { nodes, url: urlFor(filename), ids: new Set(nodes.map(node => attr(node, 'id')).filter(Boolean)) }];
})));

async function localFile(reference, base) {
  const url = new URL(reference, base);
  if (url.origin !== origin) return undefined;
  const filename = path.resolve(buildDir, '.' + decodeURIComponent(url.pathname));
  assert.ok(filename === buildDir || filename.startsWith(buildDir + path.sep), `URL escapes build directory: ${url}`);
  let info;
  try {
    info = await stat(filename);
  } catch {
    assert.fail(`Missing local resource: ${reference} from ${base.pathname}`);
  }
  const resolved = info.isDirectory() ? path.join(filename, 'index.html') : filename;
  assert.ok((await stat(resolved)).isFile(), `Missing local page: ${url}`);
  return { filename: resolved, url };
}

function candidates(value) {
  return (value || '').split(',').map(candidate => candidate.trim().split(/\s+/));
}

test('important routes and nonempty page titles survive the build', () => {
  for (const route of ['index.html', 'en/index.html', 'en/skills/index.html', 'skills/index.html', 'hobbies/index.html', 'blog/index.html', 'tags/index.html']) {
    assert.ok(pages.has(path.join(buildDir, route)), `Missing route: ${route}`);
  }
  let articles = 0;
  for (const { nodes, url } of pages.values()) {
    const titles = nodes.filter(node => node.tagName === 'title');
    assert.equal(titles.length, 1, `${url.pathname}: expected exactly one title`);
    const title = normalizedText(titles[0]);
    assert.ok(title && !/^(undefined|null)$/i.test(title), `${url.pathname}: empty title`);
    if (nodes.some(node => hasClass(node, 'article__cover-pic'))) {
      articles++;
      const h1 = nodes.find(node => node.tagName === 'h1');
      assert.ok(h1, `${url.pathname}: missing article heading`);
      const heading = descendants(h1).find(node => hasClass(node, 'title__text')) || h1;
      assert.equal(title, normalizedText(heading), `${url.pathname}: title differs from article heading`);
    }
  }
  assert.ok(articles > 0, 'The blog must contain articles');
});

test('document languages match routes and the complete Pagefind index', async () => {
  const counts = {};
  for (const { nodes, url } of pages.values()) {
    const expected = /^\/en(?:\/|$)/.test(url.pathname) ? 'en' : 'ru';
    const html = nodes.find(node => node.tagName === 'html');
    assert.equal(attr(html, 'lang'), expected, `${url.pathname}: wrong document language`);
    counts[expected] = (counts[expected] || 0) + 1;
  }
  const entry = JSON.parse(await readFile(path.join(buildDir, 'pagefind/pagefind-entry.json'), 'utf8'));
  const indexed = Object.fromEntries(Object.entries(entry.languages).map(([language, data]) => [language, data.page_count]));
  assert.deepEqual(indexed, counts, 'Pagefind must index every document in its own language');
  const fragments = await readdir(path.join(buildDir, 'pagefind/fragment'));
  for (const [language, count] of Object.entries(counts)) {
    assert.equal(fragments.filter(name => name.startsWith(language + '_') && name.endsWith('.pf_fragment')).length, count, `${language}: incomplete Pagefind fragments`);
    await localFile(`/pagefind/wasm.${language}.pagefind`, new URL(origin));
  }
  await localFile('/pagefind/pagefind.js', new URL(origin));
});

test('local links, fragments, media, and CSS resources resolve', async () => {
  for (const { nodes, url } of pages.values()) {
    for (const node of nodes) {
      for (const name of ['href', 'src', 'poster']) {
        const reference = attr(node, name);
        if (reference === undefined) continue;
        const target = await localFile(reference, url);
        if (target?.url.hash && pages.has(target.filename)) {
          const id = decodeURIComponent(target.url.hash.slice(1));
          assert.ok(pages.get(target.filename).ids.has(id), `${url.pathname}: missing fragment ${reference}`);
        }
      }
      const srcset = attr(node, 'srcset');
      if (srcset) {
        for (const [reference] of candidates(srcset)) await localFile(reference, url);
      }
    }
  }
  for (const filename of files.filter(filename => filename.endsWith('.css'))) {
    const css = await readFile(filename, 'utf8');
    for (const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) {
      await localFile(match[1], urlFor(filename));
    }
  }
});

test('pictures retain real 1x/2x variants, MIME types, and theme sources', async () => {
  const metadata = new Map();
  const mime = { '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
  const formats = { '.avif': 'heif', '.webp': 'webp', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png' };

  async function imageMetadata(reference, base) {
    const target = await localFile(reference, base);
    assert.ok(target, `Expected a local image: ${reference}`);
    if (!metadata.has(target.filename)) metadata.set(target.filename, sharp(target.filename).metadata());
    const result = await metadata.get(target.filename);
    const extension = path.extname(target.filename);
    assert.equal(result.format, formats[extension], `${reference}: wrong image format`);
    if (extension === '.avif') assert.equal(result.compression, 'av1', `${reference}: wrong AVIF codec`);
    return result;
  }

  async function densityPair(srcset, base) {
    const pair = candidates(srcset);
    assert.deepEqual(pair.map(([, density]) => density), ['1x', '2x'], `${base.pathname}: invalid density candidates`);
    assert.notEqual(pair[0][0], pair[1][0], `${base.pathname}: 1x and 2x reuse the same file`);
    const [small, large] = await Promise.all(pair.map(([reference]) => imageMetadata(reference, base)));
    assert.equal(small.width, Math.max(1, Math.round(large.width / 2)), `${pair[0][0]}: wrong 1x width`);
    assert.equal(small.height, Math.max(1, Math.round(large.height / 2)), `${pair[0][0]}: wrong 1x height`);
    return { pair, small };
  }

  let pictureCount = 0;
  for (const { nodes, url } of pages.values()) {
    for (const picture of nodes.filter(node => node.tagName === 'picture')) {
      pictureCount++;
      const children = descendants(picture);
      const images = children.filter(node => node.tagName === 'img');
      assert.equal(images.length, 1, `${url.pathname}: picture must contain one fallback image`);
      const img = images[0];
      const { pair, small } = await densityPair(attr(img, 'srcset'), url);
      assert.equal(attr(img, 'src'), pair[0][0], `${url.pathname}: fallback must use the 1x file`);
      assert.equal(Number(attr(img, 'width')), small.width, `${url.pathname}: wrong HTML width`);
      assert.equal(Number(attr(img, 'height')), small.height, `${url.pathname}: wrong HTML height`);

      const groups = new Map();
      for (const source of children.filter(node => node.tagName === 'source')) {
        const theme = attr(source, 'data-dark') !== undefined ? 'dark' : attr(source, 'data-light') !== undefined ? 'light' : 'plain';
        if (!groups.has(theme)) groups.set(theme, []);
        groups.get(theme).push(source);
        assert.equal(attr(source, 'media'), theme === 'plain' ? undefined : `(prefers-color-scheme: ${theme})`, `${url.pathname}: incorrect theme media`);
        const { pair: variants } = await densityPair(attr(source, 'srcset'), url);
        for (const [reference] of variants) {
          assert.equal(attr(source, 'type'), mime[path.extname(new URL(reference, url).pathname)], `${reference}: incorrect source MIME`);
        }
      }
      assert.ok(groups.has('plain') ? groups.size === 1 : groups.size === 2 && groups.has('dark') && groups.has('light'), `${url.pathname}: incomplete theme source groups`);
      for (const sources of groups.values()) {
        assert.equal(sources.length, 3, `${url.pathname}: expected AVIF, WebP, and fallback sources`);
        assert.deepEqual(sources.slice(0, 2).map(source => attr(source, 'type')), ['image/avif', 'image/webp'], `${url.pathname}: modern formats are shadowed`);
      }
    }
  }
  assert.ok(pictureCount > 0, 'The build must contain optimized pictures');
});
