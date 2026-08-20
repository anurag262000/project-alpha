// One-time verification code policy. Codes are short numeric so they're easy to
// type from an email; brute-force is bounded by the attempt limit + short TTL.
export const OTP_TTL_SECONDS = 10 * 60; // code valid for 10 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses before the code is burned
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // min gap between (re)sends

// A uniform 6-digit code, zero-padded, from a CSPRNG. Modulo bias over 2^32 vs
// 10^6 is negligible for a rate-limited, short-lived code.
export function generateOtpCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, '0');
}
