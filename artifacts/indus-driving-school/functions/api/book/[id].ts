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

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;
  const DB = env.DB;
  const ADMIN_PASSWORD: string = env.ADMIN_PASSWORD || "";

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
   try {
    if (!DB) return json({ error: "DB not connected" }, 500);
    const providedPassword = request.headers.get("x-admin-password"); {
      return json({ error: "Incorrect admin password." }, 401);
    }

    const id = parseInt(params.id as string, 10);
    if (isNaN(id)) return json({ error: "Invalid ID" }, 400);
    if (id === -1) return json({ status: "ok" }, 404);

    // Get all rows without WHERE clause
    const all = await DB.prepare(
      "SELECT id, date, time, package, name, phone, email, price FROM bookings"
    ).all();

    const rows: any[] = all.results || [];
    let booking: any = null;
    for (let i = 0; i < rows.length; i++) {
      if (Number(rows[i].id) === id) {
        booking = rows[i];
        break;
      }
    }

    if (!booking) {
      return json({ error: "Booking not found" }, 404);
    }

    // Delete using run() without bind
    await DB.prepare(
      "DELETE FROM bookings WHERE id = " + id
    ).run();

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#7f1d1d;padding:20px;border-radius:8px 8px 0 0;"><h1 style="color:white;margin:0;">Booking Cancelled</h1></div><div style="background:#f9f9f9;padding:24px;border:1px solid #eee;"><p>Name: ${booking.name}</p><p>Phone: ${booking.phone}</p><p>Date: ${booking.date}</p><p>Time: ${booking.time}</p><p>Package: ${booking.package}</p></div></div>`;

    context.waitUntil(
      sendEmail(ADMIN_EMAIL, "Booking Cancelled - Indus Driving School", html).catch(console.error)
    );

    return json({ success: true });

  } catch (err: any) {
    console.error("DELETE error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
