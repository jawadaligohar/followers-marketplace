// Stub mailer. Swap this implementation for a real provider (Resend, SendGrid, etc.)
// by replacing the body of sendMail while keeping the same signature.
export async function sendMail(opts: { to: string; subject: string; text: string }) {
  console.log(`[mailer] To: ${opts.to} | Subject: ${opts.subject}\n${opts.text}`);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendMail({
    to: email,
    subject: "Reset your Surgeon password",
    text: `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}`,
  });
}
