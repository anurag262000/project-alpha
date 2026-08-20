// Transactional email via the Resend REST API. We call the API directly with
// fetch (no `resend` SDK dependency) — leanest option and guaranteed to run on
// the Workers runtime. The API key is a secret: `wrangler secret put
// RESEND_API_KEY` in prod, `.dev.vars` locally. Never hardcode it — it would
// land in git and in the bundled index.js.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Defaults to Resend's shared onboarding sender (see note below). */
  from?: string;
}

// The verification-code email. Kept inline-styled and simple — mail clients
// strip <style>/<head>, so all styling must be inline on the elements.
export function verificationEmail(code: string): { subject: string; html: string } {
  return {
    subject: `${code} is your Project Alpha verification code`,
    html: `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h1 style="font-size:18px;margin:0 0 8px">Confirm your email</h1>
        <p style="font-size:14px;color:#555;margin:0 0 20px">
          Enter this code in the app to finish setting up your account.
        </p>
        <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;
                    padding:16px;background:#f4f4f5;border-radius:12px">${code}</div>
        <p style="font-size:12px;color:#888;margin:20px 0 0">
          This code expires in 10 minutes. If you didn't request it, you can ignore this email.
        </p>
      </div>`,
  };
}

export async function sendEmail(apiKey: string, msg: EmailMessage): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      // `onboarding@resend.dev` works with no domain setup, but can only send
      // to your own Resend account email until you verify a sending domain.
      from: msg.from ?? 'onboarding@resend.dev',
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
}
