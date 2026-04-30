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
        "SELECT id, date, time, package, name, phone, email, price, created_at as createdAt FROM bookings ORDER BY date ASC"
      ).all();
      return json(result.results || []);
    }

    if (method === "POST") {
      const body = await request.json() as any;
      const { date, time, package: pkg, name, phone, email, price } = body;

      if (!date || !time || !pkg || !name || !phone || !email)
        return json({ error: "Missing required fields" }, 400);

      // Check existing
      const allBookings = await DB.prepare(
        "SELECT id, date, time FROM bookings"
      ).all();
      const taken = (allBookings.results || []).find(
        (b: any) => b.date === date && b.time === time
      );
      if (taken)
        return json({ error: "This time slot is already booked. Please choose another time." }, 409);

      // Insert WITHOUT RETURNING
      await DB.prepare(
        "INSERT INTO bookings (date, time, package, name, phone, email, price) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(date, time, pkg, name, phone, email || "", price || "").run();

      // Get the inserted booking
      const all = await DB.prepare(
        "SELECT id, date, time, package, name, phone, email, price FROM bookings ORDER BY id DESC"
      ).all();
      const booking = (all.results || [])[0];

      // Send emails
      const adminHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#c0392b;padding:20px;border-radius:8px 8px 0 0;"><h1 style="color:white;margin:0;">New Booking</h1></div><div style="background:#f9f9f9;padding:24px;border:1px solid #eee;"><p><b>Name:</b> ${name}</p><p><b>Phone:</b> ${phone}</p><p><b>Email:</b> ${email}</p><p><b>Date:</b> ${date}</p><p><b>Time:</b> ${time}</p><p><b>Package:</b> ${pkg}</p>${price ? `<p><b>Price:</b> ${price}</p>` : ""}</div></div>`;

      const customerHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#c0392b;padding:24px;border-radius:8px 8px 0 0;text-align:center;"><h1 style="color:white;margin:0;">Booking Confirmed!</h1></div><div style="background:#f9f9f9;padding:24px;border:1px solid #eee;"><p>Hi <b>${name}</b>!</p><p><b>Date:</b> ${date}</p><p><b>Time:</b> ${time}</p><p><b>Package:</b> ${pkg}</p>${price ? `<p><b>Price:</b> ${price}</p>` : ""}<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin-top:16px;"><p style="margin:0;"><b>Send payment to: ${PAYMENT_NUMBER}</b></p></div><p>Call: +61 426 826 282</p></div></div>`;

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
