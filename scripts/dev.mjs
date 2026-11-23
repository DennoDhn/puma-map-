import { spawn } from 'node:child_process';
try {
  process.loadEnvFile('.env');
} catch {
  /* Environment may be injected by the host. */
}
// Optional ignored local-only bootstrap used in restricted development environments.
let cleanup;
if (process.env.PUMAMAP_DEV_BOOTSTRAP) {
  const bootstrap = await import(process.env.PUMAMAP_DEV_BOOTSTRAP);
  cleanup = await bootstrap.start();
}
const input = process.argv.slice(2);
const args = [];
for (let i = 0; i < input.length; i++) {
  if (input[i] === '--strictPort') continue;
  args.push(input[i] === '--host' ? '--hostname' : input[i]);
}
const child = spawn(
  process.execPath,
  [
    'node_modules/next/dist/bin/next',
    'dev',
    ...(process.env.PUMAMAP_DEV_WEBPACK === '1' ? ['--webpack'] : []),
    ...args,
  ],
  {
    stdio: 'inherit',
    env: process.env,
  },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', async (code) => {
  await cleanup?.();
  process.exit(code ?? 0);
});
