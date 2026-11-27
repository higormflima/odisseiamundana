import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const excludedPaths = new Set(['/', '/404/']);

/** Converte arquivos index.html gerados em URLs públicas, em ordem estável. */
export function buildSitemap(htmlFiles, siteUrl) {
  const urls = htmlFiles
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => file === 'index.html' || file.endsWith('/index.html'))
    .map((file) => `/${file.slice(0, -'index.html'.length)}`)
    .filter((urlPath) => !excludedPaths.has(urlPath))
    .sort();
  const entries = urls.map((urlPath) => `  <url><loc>${new URL(urlPath, siteUrl).href}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

/** Páginas com meta robots "noindex" (ex.: redirecionamentos) ficam fora do sitemap. */
export function isIndexable(html) {
  return !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
}

async function listHtmlFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) return entry.name === 'pagefind' ? [] : listHtmlFiles(path.join(directory, entry.name), relative);
    return entry.name.endsWith('.html') ? [relative] : [];
  }));
  return files.flat();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { default: astroConfig } = await import('../astro.config.mjs');
  const distDirectory = path.resolve('dist');
  const htmlFiles = await listHtmlFiles(distDirectory);
  const indexable = [];
  for (const file of htmlFiles) {
    if (isIndexable(await readFile(path.join(distDirectory, file), 'utf8'))) indexable.push(file);
  }
  const sitemap = buildSitemap(indexable, astroConfig.site);
  await writeFile(path.join(distDirectory, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`sitemap.xml gerado com ${sitemap.match(/<url>/g)?.length ?? 0} páginas.`);
}
