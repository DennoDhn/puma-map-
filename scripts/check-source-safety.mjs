import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const rejected = [];
for (const file of files) {
  if (
    /(^|\/)(\.local|node_modules|\.next|test-results|playwright-report)(\/|$)/.test(file) ||
    (/(^|\/)\.env($|\.)/.test(file) && !file.endsWith('.env.example')) ||
    /\.(dump|backup|pem|key)$/.test(file)
  )
    rejected.push(file);
  if (!file.endsWith('package-lock.json')) {
    const text = readFileSync(file, 'utf8');
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) ||
      /gh[pousr]_[A-Za-z0-9]{30,}/.test(text)
    )
      rejected.push(file);
  }
}
if (rejected.length) {
  console.error('Unsafe tracked paths or credential patterns:', [...new Set(rejected)]);
  process.exitCode = 1;
} else
  console.log(
    `Source safety check passed for ${files.length} tracked paths. This is not a comprehensive secret scanner.`,
  );
