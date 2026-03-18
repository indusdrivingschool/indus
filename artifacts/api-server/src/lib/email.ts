import nodemailer from "nodemailer";

const GMAIL_USER = "indusdrivingschoolau@gmail.com";
const ADMIN_EMAIL = "alipkau@gmail.com";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const PAYMENT_NUMBER = "0426826282";

function createTransporter() {
  if (!GMAIL_PASS) {
    console.warn("GMAIL_APP_PASSWORD not set — email notifications disabled");
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"Indus Driving School" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
}

export async function sendBookingEmail(
  type: "new" | "cancelled",
  booking: { date: string; time: string; package: string; name: string; phone: string; email?: string; price?: string }
): Promise<void> {
  if (type === "new") {
    // 1. Admin notification
    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#c0392b;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🚗 New Booking Received</h1>
        </div>
        <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;width:120px;">Name</td><td style="padding:8px 0;">${booking.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Phone</td><td style="padding:8px 0;">${booking.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Email</td><td style="padding:8px 0;">${booking.email || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Date</td><td style="padding:8px 0;">${booking.date}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Time</td><td style="padding:8px 0;">${booking.time}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Package</td><td style="padding:8px 0;">${booking.package} Package</td></tr>
            ${booking.price ? `<tr><td style="padding:8px 0;color:#666;font-weight:bold;">Price</td><td style="padding:8px 0;color:#c0392b;font-weight:bold;">${booking.price}</td></tr>` : ""}
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
          <p style="color:#888;font-size:13px;margin:0;">Indus Driving School · +61 426 826 282 · indusdrivingschool.com.au</p>
        </div>
      </div>`;

    // 2. Customer confirmation
    if (booking.email) {
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#c0392b;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:26px;">🎉 Booking Confirmed!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Thank you for choosing Indus Driving School</p>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
            <p style="font-size:16px;">Hi <strong>${booking.name}</strong>,</p>
            <p>Your driving lesson has been successfully booked. Here are your details:</p>
            <div style="background:white;border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#666;font-weight:bold;width:100px;">Date</td><td style="padding:8px 0;font-weight:bold;">${booking.date}</td></tr>
                <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Time</td><td style="padding:8px 0;font-weight:bold;">${booking.time}</td></tr>
                <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Package</td><td style="padding:8px 0;font-weight:bold;">${booking.package} Package</td></tr>
                ${booking.price ? `<tr><td style="padding:8px 0;color:#666;font-weight:bold;">Price</td><td style="padding:8px 0;font-weight:bold;color:#c0392b;">${booking.price}</td></tr>` : ""}
              </table>
            </div>
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;font-size:15px;font-weight:bold;">💳 Payment Required</p>
              <p style="margin:8px 0 0;font-size:14px;">Please send your payment to: <strong style="font-size:16px;">${PAYMENT_NUMBER}</strong></p>
              <p style="margin:8px 0 0;font-size:13px;color:#666;">Your booking will be confirmed once payment is received.</p>
            </div>
            <p>If you have any questions, please contact us:</p>
            <p>📞 <strong>+61 426 826 282</strong><br>🌐 indusdrivingschool.com.au</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <p style="color:#888;font-size:12px;margin:0;text-align:center;">Indus Driving School · Blacktown & Penrith NSW, Australia</p>
          </div>
        </div>`;

      await Promise.all([
        sendMail(ADMIN_EMAIL, "New Booking Received", adminHtml),
        sendMail(booking.email, "Booking Confirmed – Indus Driving School", customerHtml),
      ]);
    } else {
      await sendMail(ADMIN_EMAIL, "New Booking Received", adminHtml);
    }

  } else {
    // Cancellation — notify admin only
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#7f1d1d;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">❌ Booking Cancelled</h1>
        </div>
        <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;width:120px;">Name</td><td style="padding:8px 0;">${booking.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Phone</td><td style="padding:8px 0;">${booking.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Date</td><td style="padding:8px 0;">${booking.date}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Time</td><td style="padding:8px 0;">${booking.time}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Package</td><td style="padding:8px 0;">${booking.package} Package</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
          <p style="color:#888;font-size:13px;margin:0;">Indus Driving School · +61 426 826 282</p>
        </div>
      </div>`;
    await sendMail(ADMIN_EMAIL, "Booking Cancelled", html);
  }
}
