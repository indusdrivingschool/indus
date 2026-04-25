import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
  isToday,
  isBefore,
  startOfDay,
  isWeekend,
  isSameDay,
  parseISO
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon,
  CheckCircle2, ShieldCheck, Lock, Eye, EyeOff, X, CreditCard, Mail, Tag
} from "lucide-react";
import { useGetBookings, useCreateBooking } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBookingsQueryKey } from "@workspace/api-client-react";
import { useToast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";
import type { PackageItem } from "./Packages";

const PAYMENT_NUMBER = "0426826282";

// --- Form Schema ---
const bookingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  time: z.string().min(1, "Please select a time"),
  packageName: z.string().min(2, "Please select a package"),
  price: z.string().optional(),
});
type BookingFormValues = z.infer<typeof bookingSchema>;

const TIME_SLOTS = [
  "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

const ALL_PACKAGES = [
  "60 Minutes Lesson",
  "1 Hour Mock Test",
  "2 Hours Lesson",
  "2 Hrs Mock Test & Full Guidance",
  "5 Lesson Package",
  "10 Lesson Package",
  "Test Car Hire (1 Hour)",
  "Test Car Hire (2 Hours)",
];

type ModalStep = "form" | "payment" | "success";

interface BookingCalendarProps {
  preselectedPackage?: PackageItem | null;
  onClearPreselected?: () => void;
}

export function BookingCalendar({ preselectedPackage, onClearPreselected }: BookingCalendarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Weekly view state — start from Monday of the current week,
  // but if today is a weekend (Sat/Sun) jump to next week so users
  // immediately see bookable slots instead of an all-disabled grid.
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
    return (dayOfWeek === 0 || dayOfWeek === 6) ? addWeeks(thisMonday, 1) : thisMonday;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("form");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormValues | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Cancel state
  const [cancelTarget, setCancelTarget] = useState<{ id: number; name: string } | null>(null);
  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelPasswordVisible, setCancelPasswordVisible] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // --- API Hooks ---
  const { data: bookings = [], isLoading: isLoadingBookings } = useGetBookings();

  const createMutation = useCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
        setModalStep("success");
      },
      onError: (err: any) => {
        toast({
          title: "Booking Failed",
          description: err?.error || "This slot might be taken. Please try another.",
          variant: "destructive"
        });
        setModalStep("form");
      }
    }
  });

  // --- Weekly Calendar Logic ---
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const isSlotBooked = (day: Date, time: string) => {
  const dateStr = format(day, "yyyy-MM-dd");
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  return safeBookings.some(b => b.date === dateStr && b.time === time);
};

  const isSlotDisabled = (day: Date) => {
    return isBefore(day, startOfDay(new Date())) || isWeekend(day);
  };

  // --- Booking Form ---
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: "", phone: "", email: "", time: "", packageName: "", price: "" }
  });

  const watchPackageName = form.watch("packageName");

  const availableTimes = useMemo(() => {
    if (!selectedDate) return TIME_SLOTS;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const takenTimes = bookings.filter(b => b.date === dateStr).map(b => b.time);
    return TIME_SLOTS.filter(t => !takenTimes.includes(t));
  }, [selectedDate, bookings]);

  const watchTime = form.watch("time");
  useMemo(() => {
    if (watchTime && !availableTimes.includes(watchTime)) form.setValue("time", "");
  }, [availableTimes, watchTime, form]);

  const openModalForSlot = (day: Date, time?: string) => {
    setSelectedDate(day);
    setModalStep("form");
    form.reset({
      name: "",
      phone: "",
      email: "",
      time: time ?? "",
      packageName: preselectedPackage?.title ?? "",
      price: preselectedPackage ? `$${preselectedPackage.price}` : "",
    });
    setIsModalOpen(true);
  };

  // Step 1 → Step 2
  const onFormSubmit = (data: BookingFormValues) => {
    setPendingFormData(data);
    setPaymentConfirmed(false);
    setModalStep("payment");
  };

  // Step 2 → confirm booking
  const onConfirmBooking = () => {
    if (!selectedDate || !pendingFormData) return;
    createMutation.mutate({
      data: {
        date: format(selectedDate, "yyyy-MM-dd"),
        time: pendingFormData.time,
        package: pendingFormData.packageName,
        name: pendingFormData.name,
        phone: pendingFormData.phone,
        email: pendingFormData.email,
        price: pendingFormData.price || "",
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStep("form");
    setPaymentConfirmed(false);
    setPendingFormData(null);
    onClearPreselected?.();
    form.reset();
  };

  // --- Admin Login ---
  const handleAdminLogin = async () => {
    setIsVerifying(true);
    setAdminError("");
    try {
      const res = await fetch("/api/book/-1", {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
      if (res.status === 404 || res.status === 200) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminPassword("");
        toast({ title: "Admin Access Granted", description: "You can now cancel bookings." });
      } else {
        setAdminError("Incorrect password. Please try again.");
      }
    } catch {
      setAdminError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- Cancel with password ---
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/book/${cancelTarget.id}`, {
        method: "DELETE",
        headers: { "x-admin-password": cancelPassword }
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
        toast({ title: "Booking Cancelled", description: "The booking has been removed." });
        setCancelTarget(null);
        setCancelPassword("");
        setCancelError("");
      } else {
        const data = await res.json();
        setCancelError(data.error || "Incorrect password.");
      }
    } catch {
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const weekLabel = `${format(weekStart, "d MMM")} – ${format(addDays(weekStart, 6), "d MMM, yyyy")}`;

  return (
    <section id="booking" className="py-24 bg-secondary/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Schedule a Lesson</span>
          <h3 className="text-4xl md:text-5xl font-bold font-display text-foreground">Book Your Session</h3>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Click any <span className="text-emerald-600 font-bold">Available</span> slot to book. Payment via bank transfer to <strong>{PAYMENT_NUMBER}</strong>.
          </p>

          {preselectedPackage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary/10 border border-primary/25 text-primary"
            >
              <Tag className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold text-sm">
                Package selected: <strong>{preselectedPackage.title}</strong> — ${preselectedPackage.price} · Now pick a slot below
              </span>
              <button onClick={onClearPreselected} className="ml-1 hover:text-primary/60 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Weekly Slot Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
        >
          {/* Grid Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-card">
            <button
              onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border font-semibold text-sm hover:bg-secondary transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Prev Week
            </button>
            <div className="text-center">
              <h4 className="font-bold text-lg text-foreground">{weekLabel}</h4>
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Available
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                  <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Booked
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm bg-muted border border-border inline-block" /> Unavailable
                </span>
              </div>
            </div>
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border font-semibold text-sm hover:bg-secondary transition-all"
            >
              Next Week <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          {isLoadingBookings ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[700px]">
                {/* Day headers */}
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="w-24 py-3 px-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary/30 border-r border-border/30">
                      Time
                    </th>
                    {weekDays.map((day) => {
                      const disabled = isSlotDisabled(day);
                      return (
                        <th
                          key={day.toISOString()}
                          className={cn(
                            "py-3 px-2 text-center text-xs font-bold uppercase tracking-wider border-r border-border/30 last:border-r-0",
                            disabled ? "bg-muted/30 text-muted-foreground" : "bg-secondary/30 text-foreground",
                            isToday(day) && "bg-primary/5 text-primary"
                          )}
                        >
                          <div className="font-bold">{format(day, "EEE")}</div>
                          <div className={cn("text-xs mt-0.5", isToday(day) ? "text-primary font-bold" : "text-muted-foreground font-medium")}>
                            {format(day, "d MMM")}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Time slot rows */}
                <tbody>
                  {TIME_SLOTS.map((time, rowIdx) => (
                    <tr
                      key={time}
                      className={cn(
                        "border-b border-border/30 last:border-b-0",
                        rowIdx % 2 === 0 ? "bg-white" : "bg-secondary/10"
                      )}
                    >
                      {/* Time label */}
                      <td className="py-2.5 px-3 text-xs font-bold text-muted-foreground whitespace-nowrap border-r border-border/30 bg-secondary/20">
                        {time}
                      </td>

                      {/* Day cells */}
                      {weekDays.map((day) => {
                        const disabled = isSlotDisabled(day);
                        const booked = !disabled && isSlotBooked(day, time);
                        const available = !disabled && !booked;

                        return (
                          <td
                            key={day.toISOString()}
                            className="py-2 px-2 text-center border-r border-border/30 last:border-r-0"
                          >
                            {disabled ? (
                              <span className="inline-block w-full text-center text-xs text-muted-foreground/40 py-1">—</span>
                            ) : booked ? (
                              <span className="inline-block px-3 py-1.5 rounded-md bg-red-500 text-white text-xs font-bold w-full text-center select-none">
                                Booked
                              </span>
                            ) : (
                              <button
                                onClick={() => openModalForSlot(day, time)}
                                className="inline-block px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold w-full text-center transition-colors duration-150 active:scale-95"
                              >
                                Available
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Upcoming Bookings List */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-3xl font-bold font-display">Upcoming Bookings</h3>
            {!isAdmin ? (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-300 shadow-sm"
              >
                <Lock className="w-4 h-4" /> Admin Access
              </button>
            ) : (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold shadow-sm">
                <ShieldCheck className="w-4 h-4" /> Admin Mode Active
                <div className="w-px h-4 bg-emerald-200 mx-1" />
                <button onClick={() => setIsAdmin(false)} className="text-emerald-500 hover:text-emerald-800 transition-colors" title="Logout">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {isLoadingBookings ? (
            <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : bookings.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-3xl p-12 text-center text-muted-foreground shadow-sm">
              <CalendarIcon className="w-16 h-16 mx-auto mb-6 text-primary/20" />
              <p className="text-lg font-medium">No upcoming bookings scheduled.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 p-6 rounded-3xl shadow-md flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                        {booking.package}
                      </span>
                      <span className="text-sm font-bold bg-secondary px-3 py-1.5 rounded-lg">{booking.time}</span>
                    </div>
                    <h4 className="font-bold text-xl mb-1">{booking.name}</h4>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{format(parseISO(booking.date), "EEEE, MMMM d, yyyy")}</p>
                    {booking.price && <p className="text-xs text-primary font-semibold mb-4">{booking.price}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setCancelTarget({ id: booking.id, name: booking.name }); setCancelError(""); setCancelPassword(""); }}
                      className="w-full py-3 px-4 rounded-xl bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive hover:text-white transition-colors duration-300"
                    >
                      Cancel Booking
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* STEP 1 – Booking Form */}
            {modalStep === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card relative z-10 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 border border-border overflow-y-auto max-h-[90vh]"
              >
                <div className="mb-6 pb-5 border-b border-border/50">
                  <h3 className="text-2xl font-bold font-display">Book a Lesson</h3>
                  <p className="text-muted-foreground mt-1">
                    <span className="font-bold text-primary">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-5">
                  {preselectedPackage && (
                    <div className="flex items-center gap-3 bg-primary/5 border border-primary/25 rounded-xl px-4 py-3">
                      <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Pre-selected Package</span>
                        <p className="text-sm font-semibold text-foreground truncate">{preselectedPackage.title} — <span className="text-primary">${preselectedPackage.price}</span></p>
                      </div>
                      <button type="button" onClick={onClearPreselected} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold tracking-wide">Time Slot <span className="text-destructive">*</span></label>
                      <select
                        {...form.register("time")}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-sm"
                      >
                        <option value="">Select Time</option>
                        {TIME_SLOTS.map(t => (
                          <option key={t} value={t} disabled={!availableTimes.includes(t)}>
                            {t}{!availableTimes.includes(t) ? " (Booked)" : ""}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.time && <p className="text-xs text-destructive">{form.formState.errors.time.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold tracking-wide">Package <span className="text-destructive">*</span></label>
                      <select
                        {...form.register("packageName")}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-sm"
                      >
                        <option value="">Select Package</option>
                        {ALL_PACKAGES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      {form.formState.errors.packageName && <p className="text-xs text-destructive">{form.formState.errors.packageName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold tracking-wide">Agreed Price <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <input
                      {...form.register("price")}
                      placeholder="e.g. $65"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold tracking-wide">Full Name <span className="text-destructive">*</span></label>
                    <input
                      {...form.register("name")}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold tracking-wide">Phone Number <span className="text-destructive">*</span></label>
                    <input
                      {...form.register("phone")}
                      placeholder="+61 400 000 000"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    />
                    {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold tracking-wide">Email Address <span className="text-destructive">*</span></label>
                    <input
                      {...form.register("email")}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    />
                    {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                    <p className="text-xs text-muted-foreground">Confirmation will be sent to this email.</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={closeModal} className="flex-1 py-3.5 rounded-xl border border-border font-bold hover:bg-secondary transition-all">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-xl transition-all flex justify-center items-center gap-2"
                    >
                      Next: Payment →
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2 – Payment Confirmation */}
            {modalStep === "payment" && pendingFormData && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card relative z-10 w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 border border-border"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Payment Required</h3>
                  <p className="text-muted-foreground mt-2 text-sm">Please send payment before confirming your booking</p>
                </div>

                <div className="bg-secondary/50 rounded-2xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-bold">{format(selectedDate, "EEE, MMM d, yyyy")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-bold">{pendingFormData.time}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-bold">{pendingFormData.packageName}</span></div>
                  {pendingFormData.price && <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-bold text-primary">{pendingFormData.price}</span></div>}
                </div>

                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-5 text-center">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Send Payment To</p>
                  <p className="text-3xl font-black text-amber-900 tracking-wider">{PAYMENT_NUMBER}</p>
                  <p className="text-xs text-amber-700 mt-2">Bank transfer / PayID / Cash</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer mb-6 group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={paymentConfirmed}
                      onChange={e => setPaymentConfirmed(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                      paymentConfirmed ? "bg-primary border-primary" : "border-border bg-background group-hover:border-primary/50"
                    )}>
                      {paymentConfirmed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm font-medium leading-snug">
                    I have sent the payment to <strong>{PAYMENT_NUMBER}</strong> and understand my booking will be confirmed upon receipt.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button onClick={() => setModalStep("form")} className="flex-1 py-3.5 rounded-xl border border-border font-bold hover:bg-secondary transition-all text-sm">
                    ← Back
                  </button>
                  <button
                    onClick={onConfirmBooking}
                    disabled={!paymentConfirmed || createMutation.isPending}
                    className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Confirm Booking
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 – Success */}
            {modalStep === "success" && pendingFormData && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-card relative z-10 w-full max-w-md rounded-3xl shadow-2xl p-8 border border-border text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </motion.div>

                <h3 className="text-2xl font-bold font-display mb-2">Booking Confirmed!</h3>
                <p className="text-muted-foreground mb-6">
                  Details have been sent to <strong>{pendingFormData.email}</strong>
                </p>

                <div className="bg-secondary/50 rounded-2xl p-4 mb-5 text-sm text-left space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-bold">{format(selectedDate, "EEE, MMM d, yyyy")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-bold">{pendingFormData.time}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-bold">{pendingFormData.packageName}</span></div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">Payment Reminder</span>
                  </div>
                  <p className="text-sm text-amber-700">Send payment to <strong className="text-lg">{PAYMENT_NUMBER}</strong></p>
                </div>

                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mb-6">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Confirmation email sent to {pendingFormData.email}</span>
                </div>

                <button onClick={closeModal} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all">
                  Done
                </button>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ── ADMIN LOGIN MODAL ── */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowAdminLogin(false); setAdminError(""); setAdminPassword(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card relative z-10 w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-border"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Lock className="w-8 h-8 text-foreground/70" />
                </div>
                <h3 className="text-2xl font-bold font-display">Admin Access</h3>
                <p className="text-muted-foreground mt-2">Enter credentials to manage bookings</p>
              </div>
              <div className="space-y-5">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={e => { setAdminPassword(e.target.value); setAdminError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
                    placeholder="Admin password"
                    className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-foreground focus:ring-4 focus:ring-foreground/10 transition-all outline-none font-medium pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {adminError && <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">{adminError}</p>}
                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setShowAdminLogin(false); setAdminError(""); setAdminPassword(""); }} className="flex-1 py-3.5 rounded-xl border border-border font-bold hover:bg-secondary transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleAdminLogin}
                    disabled={!adminPassword || isVerifying}
                    className="flex-1 py-3.5 rounded-xl bg-foreground text-background font-bold shadow-lg hover:bg-foreground/90 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    Login
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {cancelTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setCancelTarget(null); setCancelError(""); setCancelPassword(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card relative z-10 w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-border"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-bold font-display">Cancel Booking</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Cancel booking for <strong className="text-foreground">{cancelTarget.name}</strong>?
                </p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={cancelPasswordVisible ? "text" : "password"}
                    value={cancelPassword}
                    onChange={e => { setCancelPassword(e.target.value); setCancelError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleCancelConfirm()}
                    placeholder="Admin password to confirm"
                    className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-destructive focus:ring-4 focus:ring-destructive/10 transition-all outline-none font-medium pr-12"
                  />
                  <button type="button" onClick={() => setCancelPasswordVisible(!cancelPasswordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {cancelPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {cancelError && <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">{cancelError}</p>}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setCancelTarget(null); setCancelError(""); setCancelPassword(""); }} className="flex-1 py-3.5 rounded-xl border border-border font-bold hover:bg-secondary transition-all">
                    Go Back
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={!cancelPassword || isCancelling}
                    className="flex-1 py-3.5 rounded-xl bg-destructive text-white font-bold shadow-lg shadow-destructive/30 hover:bg-destructive/90 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    Confirm Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
