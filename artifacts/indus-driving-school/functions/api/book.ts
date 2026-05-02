const ADMIN_EMAIL = "alipkau@gmail.com";
const FROM_EMAIL = "bookings@indusdrivingschool.com.au";
const PAYMENT_NUMBER = "0426826282";

async function sendEmail(to: string, subject: string, html: string, icsContent?: string) {
  const RESEND_API_KEY = (globalThis as any).env?.RESEND_API_KEY || "";
  
  const body: any = {
    from: `Indus Driving School <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
  };

  if (icsContent) {
    body.attachments = [{
      filename: "booking.ics",
      content: btoa(icsContent),
    }];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
  }
}

function createICS(date: string, time: string, pkg: string, name: string, phone: string, email: string, price: string): string {
  const [year, month, day] = date.split("-");
  const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hours = parseInt(timeParts![1]);
  const minutes = timeParts![2];
  const ampm = timeParts![3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const startHour = String(hours).padStart(2, "0");
  const endHour = String(hours + 1).padStart(2, "0");
  const dtStart = `${year}${month}${day}T${startHour}${minutes}00`;
  const dtEnd = `${year}${month}${day}T${endHour}${minutes}00`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Indus Driving School//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:booking-${Date.now()}@indusdrivingschool.com.au
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:Driving Lesson - ${pkg} - ${name}
DESCRIPTION:Student: ${name}\\nPhone: ${phone}\\nEmail: ${email}\\nPackage: ${pkg}${price ? `\\nPrice: ${price}` : ""}\\nPayment to: ${PAYMENT_NUMBER}
LOCATION:Blacktown / Penrith NSW Australia
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Driving lesson in 1 hour - ${name}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;
  const DB = env.DB;
  (globalThis as any).env = env;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
  };

  if (method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    if (method === "GET") {
      const result = await DB.prepare(
        "SELECT id, date, time, package, name, phone, email, price, created_at as createdAt FROM bookings ORDER BY date ASC"
      ).all();
      return json(result.results || []);
    }

    if (method === "POST") {
      const body = await request.json() as any;
      const { date, time, package: pkg, name, phone, email, price } = body;

      if (!date || !time || !pkg || !name || !phone || !email)
        return json({ error: "Missing required fields" }, 400);

      const allBookings = await DB.prepare("SELECT date, time FROM bookings").all();
      const taken = (allBookings.results || []).find(
        (b: any) => b.date === date && b.time === time
      );
      if (taken)
        return json({ error: "This time slot is already booked. Please choose another time." }, 409);

      await DB.prepare(
        "INSERT INTO bookings (date, time, package, name, phone, email, price) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(date, time, pkg, name, phone, email || "", price || "").run();

      const all = await DB.prepare(
        "SELECT id, date, time, package, name, phone, email, price FROM bookings ORDER BY id DESC"
      ).all();
      const booking = (all.results || [])[0];

      const icsContent = createICS(date, time, pkg, name, phone, email, price || "");

      const adminHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#c0392b;padding:20px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;">🚗 New Booking!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border:1px solid #eee;border-radius:0 0 8px 8px;">
            <p><b>Name:</b> ${name}</p>
            <p><b>Phone:</b> ${phone}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Date:</b> ${date}</p>
            <p><b>Time:</b> ${time}</p>
            <p><b>Package:</b> ${pkg}</p>
            ${price ? `<p><b>Price:</b> ${price}</p>` : ""}
            <div style="background:#e8f5e9;border:1px solid #4caf50;border-radius:8px;padding:16px;margin-top:16px;">
              <p style="margin:0;color:#2e7d32;font-weight:bold;">📅 Calendar invite attached!</p>
              <p style="margin:8px 0 0;color:#2e7d32;font-size:13px;">Open the .ics file to add to Google Calendar</p>
            </div>
          </div>
        </div>`;

      const customerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#c0392b;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;">🎉 Booking Confirmed!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Thank you for choosing Indus Driving School</p>
          </div>
          <div style="background:#f9f9f9;padding:24px;border:1px solid #eee;border-radius:0 0 8px 8px;">
            <p>Hi <b>${name}</b>!</p>
            <p><b>Date:</b> ${date}</p>
            <p><b>Time:</b> ${time}</p>
            <p><b>Package:</b> ${pkg}</p>
            ${price ? `<p><b>Price:</b> ${price}</p>` : ""}
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;font-weight:bold;">💳 Send payment to: ${PAYMENT_NUMBER}</p>
              <p style="margin:8px 0 0;font-size:13px;">Bank transfer / PayID / Cash</p>
            </div>
            <div style="background:#e8f5e9;border:1px solid #4caf50;border-radius:8px;padding:16px;">
              <p style="margin:0;color:#2e7d32;font-weight:bold;">📅 Calendar invite attached!</p>
              <p style="margin:8px 0 0;color:#2e7d32;font-size:13px;">Open .ics file to add to your calendar</p>
            </div>
            <p style="margin-top:16px;">Questions? Call: <b>+61 426 826 282</b></p>
          </div>
        </div>`;

      context.waitUntil(Promise.all([
        sendEmail(ADMIN_EMAIL, "New Booking - Indus Driving School", adminHtml, icsContent),
        sendEmail(email, "Booking Confirmed - Indus Driving School", customerHtml, icsContent),
      ]).catch(console.error));

      return json(booking, 201);
    }

    return json({ error: "Method not allowed" }, 405);

  } catch (err: any) {
    console.error("API error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
