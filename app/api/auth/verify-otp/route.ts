import { NextResponse } from "next/server";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import { OTP_MAX_ATTEMPTS, hashOtp } from "@/lib/auth/otp";
import { setSessionCookie } from "@/lib/auth/session";

const GENERIC_ERROR = { error: "Invalid or expired code." };

export async function POST(request: Request) {
  let email: unknown, code: unknown;
  try {
    ({ email, code } = await request.json());
  } catch {
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  if (typeof email !== "string" || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  const [record] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, normalized),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!record || record.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(GENERIC_ERROR, { status: 401 });
  }

  if (record.codeHash !== hashOtp(code)) {
    await db
      .update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(eq(otpCodes.id, record.id));
    return NextResponse.json(GENERIC_ERROR, { status: 401 });
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, record.id));

  await setSessionCookie(normalized);

  return NextResponse.json({ ok: true });
}
