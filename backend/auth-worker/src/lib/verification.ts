import { eq } from 'drizzle-orm';
import { emailCodes } from '../schema';
import { hashPassword, verifyPassword } from './crypto';
import { sendEmail, verificationEmail } from './email';
import { generateOtpCode, OTP_TTL_SECONDS, OTP_RESEND_COOLDOWN_SECONDS, OTP_MAX_ATTEMPTS } from './otp';
import type { DB } from './db';
import type { Bindings } from '../types';

const nowSec = () => Math.floor(Date.now() / 1000);

export class CooldownError extends Error {
  constructor(public retryAfter: number) {
    super('Please wait before requesting another code.');
  }
}

/**
 * Generate a fresh code, store it (hashed, replacing any prior code for this
 * user), and email it. Enforces a resend cooldown. `RESEND_FROM` selects the
 * sender; it falls back to Resend's test domain when unset.
 */
export async function issueAndSendCode(env: Bindings, db: DB, userId: string, email: string): Promise<void> {
  const [existing] = await db.select().from(emailCodes).where(eq(emailCodes.userId, userId)).limit(1);
  if (existing) {
    const elapsed = nowSec() - existing.sentAt;
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) throw new CooldownError(OTP_RESEND_COOLDOWN_SECONDS - elapsed);
  }

  const code = generateOtpCode();
  const { hash, salt } = await hashPassword(code);
  await db.delete(emailCodes).where(eq(emailCodes.userId, userId));
  await db.insert(emailCodes).values({
    userId,
    codeHash: hash,
    codeSalt: salt,
    expiresAt: nowSec() + OTP_TTL_SECONDS,
    sentAt: nowSec(),
    attempts: 0,
  });

  const { subject, html } = verificationEmail(code);
  await sendEmail(env.RESEND_API_KEY, {
    from: env.RESEND_FROM || undefined,
    to: email,
    subject,
    html,
  });
}

export type CodeCheck =
  | { ok: true }
  | { ok: false; reason: 'no_code' | 'expired' | 'too_many' | 'invalid' };

/**
 * Validate a submitted code against the stored hash. Consumes the code on
 * success or when it becomes unusable (expired / attempts exhausted); increments
 * the attempt counter on a wrong guess.
 */
export async function checkCode(db: DB, userId: string, code: string): Promise<CodeCheck> {
  const [row] = await db.select().from(emailCodes).where(eq(emailCodes.userId, userId)).limit(1);
  if (!row) return { ok: false, reason: 'no_code' };

  if (row.expiresAt < nowSec()) {
    await db.delete(emailCodes).where(eq(emailCodes.userId, userId));
    return { ok: false, reason: 'expired' };
  }
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    await db.delete(emailCodes).where(eq(emailCodes.userId, userId));
    return { ok: false, reason: 'too_many' };
  }

  const valid = await verifyPassword(code, row.codeHash, row.codeSalt);
  if (!valid) {
    await db
      .update(emailCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailCodes.userId, userId));
    return { ok: false, reason: 'invalid' };
  }

  await db.delete(emailCodes).where(eq(emailCodes.userId, userId));
  return { ok: true };
}
