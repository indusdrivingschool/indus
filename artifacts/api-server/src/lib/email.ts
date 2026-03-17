import nodemailer from "nodemailer";

const GMAIL_USER = "indusdrivingschoolau@gmail.com";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

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

export async function sendEmail(subject: string, body: string): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: `"Indus Driving School" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject,
      text: body,
      html: `<pre style="font-family:sans-serif;font-size:14px;">${body}</pre>`,
    });
    console.log(`Email sent: ${subject}`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export async function sendBookingEmail(
  type: "new" | "cancelled",
  booking: { date: string; time: string; package: string; name: string; phone: string }
): Promise<void> {
  const subject =
    type === "new" ? "New Booking Received" : "Booking Cancelled";

  const body = `${subject}

Name: ${booking.name}
Phone: ${booking.phone}
Date: ${booking.date}
Time: ${booking.time}
Package: ${booking.package} Package

--
Indus Driving School
Phone: +61 426 826 282
indusdrivingschool.com.au`;

  await sendEmail(subject, body);
}
