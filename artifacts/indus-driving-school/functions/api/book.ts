const GMAIL_USER = "indusdrivingschoolau@gmail.com";
const ADMIN_EMAIL = "alipkau@gmail.com";
const PAYMENT_NUMBER = "0426826282";

async function sendEmail(to: string, subject: string, html: string) {
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
}

async function queryDB(databaseUrl: string, sql: string, params: any[] = []) {
  const url = new URL(databaseUrl);
  const response = await fetch(`https://${url.hostname}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${url.username}:${decodeURIComponent(url.password)}`)}`,
    },
    body: JSON.stringify({ query: sql, params }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;
  const DATABASE_URL: string = env.DATABASE_URL;
  const GMAIL_PASS: string = env.GMAIL_APP_PASSWORD || "";

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
      const result = await queryDB(
        DATABASE_URL,
        `SELECT id, date, time, package, name, phone, email, price, created_at as "createdAt" FROM bookings ORDER BY date ASC`
      );
      return json(result.rows || []);
    }

    if (method === "POST") {
      const body = await request.json() as any;
      const { date, time, package: pkg, name, phone, email, price } = body;

      if (!date || !time || !pkg || !name || !phone || !email)
        return json({ error: "Missing required fields" }, 400);

      const existing = await queryDB(
        DATABASE_URL,
        `SELECT id FROM bookings WHERE date = $1 AND time = $2`,
        [date, time]
      );
      if ((existing.rows || []).length > 0)
        return json({ error: "This time slot is already booked. Please choose another time." }, 409);

      const insert = await queryDB(
        DATABASE_URL,
        `INSERT INTO bookings (date, time, package, name, phone, email, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, date, time, package, name, phone, email, price, created_at as "createdAt"`,
        [date, time, pkg, name, phone, email || "", price || ""]
      );
      const booking = (insert.rows || [])[0];

      // Send emails
      const adminHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#c0392b;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🚗 New Booking Received</h1>
        </div>
        <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
          <table style="width:100%;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;width:120px;">Name</td><td>${name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Phone</td><td>${phone}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Email</td><td>${email}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Date</td><td>${date}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Time</td><td>${time}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Package</td><td>${pkg}</td></tr>
            ${price ? `<tr><td style="padding:8px 0;color:#666;font-weight:bold;">Price</td><td style="color:#c0392b;font-weight:bold;">${price}</td></tr>` : ""}
          </table>
        </div>
      </div>`;

      const customerHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#c0392b;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">🎉 Booking Confirmed!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Thank you for choosing Indus Driving School</p>
        </div>
        <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
          <p>Hi <strong>${name}</strong>, your lesson is booked!</p>
          <div style="background:white;border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0;">
            <table style="width:100%;">
              <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Date</td><td style="font-weight:bold;">${date}</td></tr>
              <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Time</td><td style="font-weight:bold;">${time}</td></tr>
              <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Package</td><td style="font-weight:bold;">${pkg}</td></tr>
              ${price ? `<tr><td style="padding:8px 0;color:#666;font-weight:bold;">Price</td><td style="font-weight:bold;color:#c0392b;">${price}</td></tr>` : ""}
            </table>
          </div>
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;">
            <p style="margin:0;font-weight:bold;">💳 Payment Required</p>
            <p style="margin:8px 0 0;">Send payment to: <strong style="font-size:18px;">${PAYMENT_NUMBER}</strong></p>
            <p style="margin:8px 0 0;font-size:13px;color:#666;">Bank transfer / PayID / Cash</p>
          </div>
          <p style="margin-top:16px;">Questions? Call us: <strong>+61 426 826 282</strong></p>
        </div>
      </div>`;

      context.waitUntil(Promise.all([
        sendEmail(ADMIN_EMAIL, "New Booking – Indus Driving School", adminHtml),
        sendEmail(email, "Booking Confirmed – Indus Driving School", customerHtml),
      ]).catch(console.error));

      return json(booking, 201);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err: any) {
    console.error("API error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
