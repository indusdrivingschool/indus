import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendBookingEmail } from "../lib/email.js";
import { sendFacebookBookingNotification } from "../lib/facebook.js";

const router: IRouter = Router();

router.get("/bookings", async (_req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable).orderBy(bookingsTable.date);
    res.json(
      bookings.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("GET /bookings error:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.post("/book", async (req, res) => {
  try {
    const { date, time, package: pkg, name, phone } = req.body;

    if (!date || !time || !pkg || !name || !phone) {
      res.status(400).json({ error: "Missing required fields: date, time, package, name, phone" });
      return;
    }

    if (!["Morning", "Evening"].includes(pkg)) {
      res.status(400).json({ error: "Package must be Morning or Evening" });
      return;
    }

    const existing = await db
      .select()
      .from(bookingsTable)
      .where(and(eq(bookingsTable.date, date), eq(bookingsTable.time, time)));

    if (existing.length > 0) {
      res.status(409).json({ error: "This time slot is already booked. Please choose another time." });
      return;
    }

    const [booking] = await db
      .insert(bookingsTable)
      .values({ date, time, package: pkg, name, phone })
      .returning();

    const bookingData = {
      date: booking.date,
      time: booking.time,
      package: booking.package,
      name: booking.name,
      phone: booking.phone,
    };

    sendBookingEmail("new", bookingData).catch(console.error);
    sendFacebookBookingNotification("new", bookingData).catch(console.error);

    res.status(201).json({ ...booking, createdAt: booking.createdAt.toISOString() });
  } catch (err) {
    console.error("POST /book error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.delete("/book/:id", async (req, res) => {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = req.headers["x-admin-password"];

    if (!adminPassword || providedPassword !== adminPassword) {
      res.status(401).json({ error: "Incorrect admin password." });
      return;
    }

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid booking ID" });
      return;
    }

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id));

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    await db.delete(bookingsTable).where(eq(bookingsTable.id, id));

    const bookingData = {
      date: booking.date,
      time: booking.time,
      package: booking.package,
      name: booking.name,
      phone: booking.phone,
    };

    sendBookingEmail("cancelled", bookingData).catch(console.error);
    sendFacebookBookingNotification("cancelled", bookingData).catch(console.error);

    res.json({ ...booking, createdAt: booking.createdAt.toISOString() });
  } catch (err) {
    console.error("DELETE /book/:id error:", err);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

export default router;
