const MAILERSEND_ENDPOINT = "https://api.mailersend.com/v1/email";

export async function sendOtpEmail(to: string, code: string) {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const from = process.env.MAILERSEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("MailerSend is not configured (MAILERSEND_API_KEY / MAILERSEND_FROM_EMAIL)");
  }

  const res = await fetch(MAILERSEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { email: from, name: "Website Developer Bali" },
      to: [{ email: to }],
      subject: `${code} is your admin login code`,
      text: `Your Website Developer Bali admin login code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 16px">Website Developer Bali</h2>
          <p>Your admin login code:</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">${code}</p>
          <p style="color:#666">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MailerSend request failed (${res.status}): ${body}`);
  }
}
