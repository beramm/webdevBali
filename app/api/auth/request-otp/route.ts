import { NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import {
  OTP_RATE_LIMIT,
  OTP_RATE_WINDOW_MS,
  OTP_TTL_MS,
  generateOtp,
  hashOtp,
} from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/mail";

// Don't re-email on every page load; a fresh code stays valid for this long.
const RESEND_COOLDOWN_MS = 60_000;

// The only account that can log in is ADMIN_EMAIL. The client never supplies an
// address — the server always targets the admin inbox.
export async function POST() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return NextResponse.json({ error: "Login unavailable." }, { status: 500 });
  }

  // Reuse a recently-sent, still-valid code instead of emailing again.
  const cooldownStart = new Date(Date.now() - RESEND_COOLDOWN_MS);
  const [fresh] = await db
    .select({ id: otpCodes.id })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, adminEmail),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.createdAt, cooldownStart),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .limit(1);
  if (fresh) {
    return NextResponse.json({ ok: true });
  }

  // Rate limit total sends within the window.
  const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
  const recent = await db
    .select({ id: otpCodes.id })
    .from(otpCodes)
    .where(
      and(eq(otpCodes.email, adminEmail), gt(otpCodes.createdAt, windowStart))
    );
  if (recent.length >= OTP_RATE_LIMIT) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const code = generateOtp();
  await db.insert(otpCodes).values({
    email: adminEmail,
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  try {
    await sendOtpEmail(adminEmail, code);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return NextResponse.json(
      { error: "Could not send email. Try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
