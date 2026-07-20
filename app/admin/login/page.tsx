"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "code";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setStep("code");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-xl font-bold text-white">Admin login</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {step === "email"
            ? "Enter your admin email to receive a one-time code."
            : `We sent a 6-digit code to ${email}.`}
        </p>

        {step === "email" ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/15 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-300/60"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full rounded-lg border border-white/15 bg-zinc-900 px-4 py-2.5 text-center text-lg tracking-[0.5em] text-white placeholder-zinc-600 outline-none focus:border-amber-300/60"
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Log in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </main>
  );
}
