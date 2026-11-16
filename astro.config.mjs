import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  markdown: {
    processor: unified(),
  },
  integrations: [mdx(), icon()],
});
