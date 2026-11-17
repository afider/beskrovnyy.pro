import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/scripts/modules/navbar.js', import.meta.url), 'utf8');

function element(attributes = {}, parentButton) {
  const classes = new Set();
  const listeners = new Map();
  const el = {
    dataset: Object.fromEntries(Object.entries(attributes)
      .filter(([name]) => name.startsWith('data-'))
      .map(([name, value]) => [name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value])),
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle(name, force) {
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name);
        else classes.delete(name);
        return enabled;
      },
    },
    getAttribute: (name) => attributes[name] ?? null,
    addEventListener: (type, listener) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    closest: (selector) => selector === 'button' ? parentButton ?? el : null,
    click(target = el) {
      for (const listener of listeners.get('click') ?? []) {
        listener.call(el, { target, currentTarget: el });
      }
    },
  };
  return el;
}

function setup({ missingNavbar = false } = {}) {
  const navbar = element({ 'data-navbar': '' });
  const names = ['search', 'theme', 'contents'];
  const buttons = Object.fromEntries(names.map((name) => [name, element({ 'data-navbar-target': `${name}-section` })]));
  const sections = Object.fromEntries(names.map((name) => [name, element({ 'data-navbar-section': `${name}-section` })]));
  const close = element({ 'data-navbar-close': '' });
  const overlay = element({ 'data-navbar-close': '' });
  let focuses = 0;
  let closes = 0;
  const field = { focus: () => focuses++ };
  const all = [...Object.values(buttons), ...Object.values(sections), close, overlay];
  if (!missingNavbar) all.push(navbar);
  const select = (selector) => {
    if (selector === '#search') return [field];
    const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    assert.ok(match, `Unsupported fixture selector: ${selector}`);
    return all.filter((el) => el.getAttribute(match[1]) !== null
      && (match[2] === undefined || el.getAttribute(match[1]) === match[2]));
  };
  const document = {
    querySelector: (selector) => select(selector)[0] ?? null,
    querySelectorAll: select,
    getElementById: (id) => id === 'search' ? field : null,
  };
  const timers = new Map();
  let timerId = 0;
  const setTimeout = (callback) => {
    timers.set(++timerId, callback);
    return timerId;
  };
  const clearTimeout = (id) => timers.delete(id);
  const initialize = new Function('document', 'setTimeout', 'clearTimeout',
    source.replace('export default ', 'return '))(document, setTimeout, clearTimeout);
  initialize({ onSearchClose: () => closes++ });
  return {
    navbar, buttons, sections, close, overlay,
    focuses: () => focuses,
    closes: () => closes,
    runTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

const active = (el) => el.classList.contains('_active');

for (const control of ['close', 'overlay']) {
  test(`${control} closes all panels and resets the search`, () => {
    const ui = setup();
    ui.buttons.search.click();
    assert.equal(active(ui.navbar), true);
    ui[control].click();
    assert.equal(ui.closes(), 1);
    assert.equal(active(ui.navbar), false);
    assert.equal(Object.values(ui.buttons).some(active), false);
    assert.equal(Object.values(ui.sections).some(active), false);
  });
}

test('clicking the active Search button closes it and resets the search', () => {
  const ui = setup();
  ui.buttons.search.click();
  ui.buttons.search.click();
  assert.equal(ui.closes(), 1);
  assert.equal(active(ui.buttons.search), false);
  assert.equal(active(ui.sections.search), false);
  assert.equal(active(ui.navbar), false);
});

for (const target of ['theme', 'contents']) {
  test(`switching from Search to ${target} resets search and keeps the new panel open`, () => {
    const ui = setup();
    ui.buttons.search.click();
    ui.buttons[target].click();
    assert.equal(ui.closes(), 1);
    assert.equal(active(ui.sections.search), false);
    assert.equal(active(ui.buttons.search), false);
    assert.equal(active(ui.sections[target]), true);
    assert.equal(active(ui.buttons[target]), true);
    assert.equal(active(ui.navbar), true);
  });
}

for (const action of ['close', 'overlay', 'toggle', 'theme', 'contents']) {
  test(`${action} prevents delayed focus from reaching the hidden search field`, () => {
    const ui = setup();
    ui.buttons.search.click();
    if (action === 'close' || action === 'overlay') ui[action].click();
    else ui.buttons[action === 'toggle' ? 'search' : action].click();
    ui.runTimers();
    assert.equal(ui.focuses(), 0);
  });
}

test('the search field receives delayed focus while its panel remains open', () => {
  const ui = setup();
  ui.buttons.search.click();
  assert.equal(ui.focuses(), 0);
  ui.runTimers();
  assert.equal(ui.focuses(), 1);
  assert.equal(active(ui.sections.search), true);
});

test('closing and reopening Search retains only the new focus request', () => {
  const ui = setup();
  ui.buttons.search.click();
  ui.close.click();
  ui.buttons.search.click();
  ui.runTimers();
  assert.equal(ui.focuses(), 1);
  assert.equal(active(ui.sections.search), true);
});

test('clicking a child of the Search button uses the owning button target', () => {
  const ui = setup();
  const icon = element({}, ui.buttons.search);
  assert.doesNotThrow(() => ui.buttons.search.click(icon));
  assert.equal(active(ui.buttons.search), true);
  assert.equal(active(ui.sections.search), true);
  assert.equal(active(ui.navbar), true);
  ui.runTimers();
  assert.equal(ui.focuses(), 1);
});

test('a missing navbar is a safe no-op', () => {
  const ui = setup({ missingNavbar: true });
  ui.close.click();
  ui.buttons.search.click();
  ui.runTimers();
  assert.equal(ui.closes(), 0);
  assert.equal(ui.focuses(), 0);
});
