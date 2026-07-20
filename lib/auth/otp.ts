import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_RATE_LIMIT = 3; // max sends per window
export const OTP_RATE_WINDOW_MS = 15 * 60 * 1000;

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(code: string): string {
  return createHash("sha256")
    .update(code + process.env.SESSION_SECRET!)
    .digest("hex");
}
