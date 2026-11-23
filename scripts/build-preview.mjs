import { build } from 'esbuild';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

const { outputFiles } = await build({
  entryPoints: ['preview/main.tsx'],
  outfile: 'pumamap.js',
  write: false,
  bundle: true,
  minify: true,
  jsx: 'automatic',
  legalComments: 'inline',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'dataurl' },
  plugins: [
    {
      name: 'preview',
      setup(builder) {
        for (const [filter, file] of [
          [/^\.\/platform-client$/, 'preview/client.ts'],
          [/^\.\/platform-dialogs$/, 'preview/read-only-dialog.tsx'],
          [/^next\/dynamic$/, 'preview/dynamic.tsx'],
          [/^next\/link$/, 'preview/link.tsx'],
        ])
          builder.onResolve({ filter }, () => ({ path: resolve(file) }));
      },
    },
  ],
});
const output = (ext) => outputFiles.find((file) => file.path.endsWith(ext)).text;
await writeFile(
  'index.html',
  `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>PumaMap · Designvorschau</title><style>${output('.css')}
.preview-note{padding:.45rem 1rem;background:#c8ff28;color:#101500;text-align:center;font:600 .875rem/1.4 system-ui}
</style></head><body><div class="preview-note">Designvorschau · Ohne Live-Daten</div><div id="app"></div><noscript>Bitte aktiviere JavaScript für die Designvorschau.</noscript><script>${output('.js').replaceAll('</script', '<\\/script')}</script></body></html>`,
);
