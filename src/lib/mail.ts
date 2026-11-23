import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { HttpError } from './security';
export function requireMail() {
  if (process.env.MAIL_MODE === 'file' && process.env.NODE_ENV !== 'production') return;
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM)
    throw new HttpError(
      503,
      'E-Mail-Versand ist noch nicht eingerichtet. Bitte später erneut versuchen.',
    );
}
export async function sendAuthMail(to: string, token: string, purpose: 'verify' | 'reset') {
  requireMail();
  const url = new URL('/', process.env.APP_ORIGIN);
  url.searchParams.set(purpose, token);
  const subject =
    purpose === 'verify' ? 'PumaMap · E-Mail bestätigen' : 'PumaMap · Passwort zurücksetzen';
  const text = `${subject}\n\n${url.toString()}\n\nDieser Link ist 30 Minuten gültig. Wenn du diese Anfrage nicht gestellt hast, ignoriere diese Nachricht.`;
  if (process.env.MAIL_MODE === 'file' && process.env.NODE_ENV !== 'production') {
    await mkdir('.local/mail', { recursive: true, mode: 0o700 });
    await writeFile(`.local/mail/${randomUUID()}.json`, JSON.stringify({ to, subject, text }), {
      mode: 0o600,
    });
    return;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transport.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
}
