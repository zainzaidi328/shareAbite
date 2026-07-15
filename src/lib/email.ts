// Email delivery. When SMTP is not configured (local dev), links are logged
// to the server console so the flows remain fully testable.

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.log(
      `\n📧 [ShareBite email → ${to}] ${subject}\n${html.replace(/<[^>]+>/g, "")}\n`
    );
    return;
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "ShareBite <no-reply@sharebite.app>",
    to,
    subject,
    html,
  });
}
