import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
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

// Always responds with a generic message so email enumeration is impossible.
export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof email !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (normalized === adminEmail) {
    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
    const recent = await db
      .select({ id: otpCodes.id })
      .from(otpCodes)
      .where(
        and(eq(otpCodes.email, normalized), gt(otpCodes.createdAt, windowStart))
      );

    if (recent.length >= OTP_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const code = generateOtp();
    await db.insert(otpCodes).values({
      email: normalized,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      await sendOtpEmail(normalized, code);
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      return NextResponse.json(
        { error: "Could not send email. Try again later." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If that email is registered, a code has been sent.",
  });
}
