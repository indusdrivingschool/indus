const GMAIL_USER = "indusdrivingschoolau@gmail.com";
const ADMIN_EMAIL = "alipkau@gmail.com";

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

async function queryDB(databaseUrl: string, sql: string, params: any[] = []) {
  const url = new URL(databaseUrl);
  const host = url.hostname;
  const response = await fetch(`https://${host}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": databaseUrl,
    },
    body: JSON.stringify({ query: sql, params }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text);
  return JSON.parse(text);
}

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;
  const DATABASE_URL: string = env.DATABASE_URL;
  const ADMIN_PASSWORD: string = env.ADMIN_PASSWORD || "";

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const providedPassword = request.headers.get("x-admin-password");
    if (!ADMIN_PASSWORD || providedPassword !== ADMIN_PASSWORD)
      return json({ error: "Incorrect admin password." }, 401);

    const id = parseInt(params.id as string, 10);
    if (isNaN(id)) return json({ error: "Invalid ID" }, 400);

    if (id === -1) return json({ status: "ok" }, 404);

    const found = await queryDB(
      DATABASE_URL,
      `SELECT * FROM bookings WHERE id = $1`,
      [id]
    );
    const booking = (found.rows || [])[0];
    if (!booking) return json({ error: "Booking not found" }, 404);

    await queryDB(DATABASE_URL, `DELETE FROM bookings WHERE id = $1`, [id]);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#7f1d1d;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">❌ Booking Cancelled</h1>
        </div>
        <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;width:120px;">Name</td><td>${booking.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Phone</td><td>${booking.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Date</td><td>${booking.date}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Time</td><td>${booking.time}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">Package</td><td>${booking.package}</td></tr>
          </table>
        </div>
      </div>`;

    context.waitUntil(
      sendEmail(ADMIN_EMAIL, "Booking Cancelled - Indus Driving School", html).catch(console.error)
    );

    return json(booking);

  } catch (err: any) {
    console.error("DELETE error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
