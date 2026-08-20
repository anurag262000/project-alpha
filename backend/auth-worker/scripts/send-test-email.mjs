// One-off smoke test — the Resend quickstart, adapted for this repo so the API
// key comes from the environment instead of being hardcoded. Run it from
// backend/auth-worker/ with your key exported:
//
//   export RESEND_API_KEY=re_xxxxxxxxx
//   node scripts/send-test-email.mjs
//
// (Export in your own terminal, not via the `!` session prompt, so the key
// stays out of the transcript.)

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('Set RESEND_API_KEY in your environment first (see the header of this file).');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
  body: JSON.stringify({
    from: 'onboarding@resend.dev',
    to: 'anuragmishra262000@gmail.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  }),
});

console.log(`HTTP ${res.status}`);
console.log(await res.text());
