import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeExternalLinks from 'rehype-external-links';
import remarkQuarto from './src/plugins/remark-quarto.mjs';
import remarkSeccoes from './src/plugins/remark-seccoes.mjs';
import rehypeTabelas from './src/plugins/rehype-tabelas.mjs';

// O endereço e o prefixo vêm do ambiente, para o mesmo código servir no
// GitHub Pages (prefixo = nome do repositório) e mais tarde no Cloudflare (prefixo "/").
const site = process.env.SITE_URL ?? 'https://filustrias.github.io';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    processor: unified({
      remarkPlugins: [[remarkQuarto, { base }], remarkSeccoes],
      rehypePlugins: [
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener'] }],
        rehypeTabelas,
      ],
    }),
  },
});
