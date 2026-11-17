'use strict';

module.exports = {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    // Load Sass modules with @use/@forward, never the deprecated @import API.
    'at-rule-disallowed-list': ['import'],
    // BEM components and the existing underscore-prefixed state classes.
    'selector-class-pattern': [
      '^(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*){0,2}|_[A-Za-z][A-Za-z0-9-]*)$',
      { resolveNestedSelectors: true },
    ],
    'selector-max-id': 0,
    // Components group their states and descendants within the same BEM block.
    'no-descending-specificity': null,
    'max-nesting-depth': [4, { ignoreAtRules: ['media'] }],
    'declaration-no-important': true,
    // Preserve progressive fallbacks such as vh followed by dvh.
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-syntaxes'] },
    ],
    'font-family-name-quotes': 'always-unless-keyword',
    'function-url-quotes': 'always',
    'color-named': 'never',
    'color-hex-length': 'short',
    'length-zero-no-unit': [true, { ignore: ['custom-properties'] }],
    'number-max-precision': 2,
    // Keep the existing min/max syntax in the generated responsive CSS.
    'media-feature-range-notation': 'prefix',
  },
};
