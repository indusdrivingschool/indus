const FB_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

export async function sendFacebookMessage(message: string): Promise<void> {
  if (!FB_PAGE_ACCESS_TOKEN || !FB_PAGE_ID) {
    console.warn("Facebook credentials not set — Facebook notifications disabled");
    return;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FB_PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_type: "UPDATE",
        recipient: { id: FB_PAGE_ID },
        message: { text: message },
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Facebook message failed:", data);
    } else {
      console.log("Facebook message sent");
    }
  } catch (err) {
    console.error("Failed to send Facebook message:", err);
  }
}

export async function sendFacebookBookingNotification(
  type: "new" | "cancelled",
  booking: { date: string; time: string; package: string; name: string; phone: string }
): Promise<void> {
  const prefix = type === "new" ? "New Booking" : "Booking Cancelled";
  const message = `${prefix}:
Name: ${booking.name}
Phone: ${booking.phone}
Date: ${booking.date}
Time: ${booking.time}
Package: ${booking.package} Package`;

  await sendFacebookMessage(message);
}
