const GMAIL_USER = "indusdrivingschoolau@gmail.com";
const ADMIN_EMAIL = "alipkau@gmail.com";
const PAYMENT_NUMBER = "0426826282";

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: GMAIL_USER, name: "Indus Driving School" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
  } catch (e) {
    console.error("Email error:", e);
  }
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;
  const DB = env.DB;

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
        `SELECT id, date, time, package, name, phone, email, price, created_at as createdAt FROM bookings ORDER BY date ASC`
      ).all();
      return json(result.results || []);
    }

    if (method === "POST") {
      const body = await request.json() as any;
      const { date, time, package: pkg, name, phone, email, price } = body;

      if (!date || !time || !pkg || !name || !phone || !email)
        return json({ error: "Missing required fields" }, 400);

      const existing = await DB.prepare(
        `SELECT id FROM bookings WHERE date = ? AND time = ?`
      ).bind(date, time).first();

      if (existing)
        return json({ error: "This time slot is already booked. Please choose another time." }, 409);

      const booking = await DB.prepare(
        `INSERT INTO bookings (date, time, package, name, phone, email, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING id, date, time, package, name, phone, email, price, created_at as createdAt`
      ).bind(date, time, pkg, name, phone, email || "", price || "").first();

      const adminHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#c0392b;padding:20px;border-radius:8px 8px 0 0;"><h1 style="color:white;margin:0;">🚗 New Booking</h1></div><div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;"><table style="width:100%;"><tr><td style="padding:6px 0;color:#666;font-weight:bold;width:100px;">Name</td><td>${name}</td></tr><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Phone</td><td>${phone}</td></tr><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Email</td><td>${email}</td></tr><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Date</td><td>${date}</td></tr><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Time</td><td>${time}</td></tr><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Package</td><td>${pkg}</td></tr>${price ? `<tr><td style="padding:6px 0;color:#666;font-weight:bold;">Price</td><td style="color:#c0392b;font-weight:bold;">${price}</td></tr>` : ""}</table></div></div>`;

      const customerHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#c0392b;padding:24px;border-radius:8px 8px 0 0;text-align:center;"><h1 style="color:white;margin:0;">🎉 Booking Confirmed!</h1></div><div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;"><p>Hi <strong>${name}</strong>!</p><table style="width:100%;"><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Date</td><td style="font-weight:bold;">${date}</td></tr><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Time</td><td style="font-weight:bold;">${time}</td></tr><tr><td style="padding:6px 0;color:#666;font-weight:bold;">Package</td><td style="font-weight:bold;">${pkg}</td></tr>${price ? `<tr><td style="padding:6px 0;color:#666;font-weight:bold;">Price</td><td style="font-weight:bold;color:#c0392b;">${price}</td></tr>` : ""}</table><div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin-top:16px;"><p style="margin:0;font-weight:bold;">💳 Send payment to: ${PAYMENT_NUMBER}</p></div><p>Call: <strong>+61 426 826 282</strong></p></div></div>`;

      context.waitUntil(Promise.all([
        sendEmail(ADMIN_EMAIL, "New Booking - Indus Driving School", adminHtml),
        sendEmail(email, "Booking Confirmed - Indus Driving School", customerHtml),
      ]).catch(console.error));

      return json(booking, 201);
    }

    return json({ error: "Method not allowed" }, 405);

  } catch (err: any) {
    console.error("API error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
