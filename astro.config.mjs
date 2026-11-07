import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: 'https://higormflima.github.io',
  base: isGitHubPagesBuild ? '/odisseiamundana' : '/',
  integrations: [mdx()],
});
