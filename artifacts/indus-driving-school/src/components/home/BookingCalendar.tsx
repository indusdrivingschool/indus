import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
  isWeekend,
  isSameDay,
  parseISO
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff, X } from "lucide-react";
import {
  useGetBookings,
  useCreateBooking,
  useCancelBooking,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBookingsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Form Schema ---
const bookingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  time: z.string().min(1, "Please select a time"),
  package: z.enum(["Morning", "Evening"], { required_error: "Please select a package" }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const TIME_SLOTS = [
  "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

export function BookingCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Cancel confirmation state
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
        toast({ title: "Booking Confirmed", description: "Your lesson has been successfully booked!" });
        setIsModalOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({
          title: "Booking Failed",
          description: err?.error || "This slot might be taken. Please try another.",
          variant: "destructive"
        });
      }
    }
  });

  const cancelMutation = useCancelBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
        toast({ title: "Booking Cancelled", description: "The booking has been removed." });
        setCancelTarget(null);
        setCancelPassword("");
        setCancelError("");
      },
      onError: (err: any) => {
        setCancelError(err?.error || "Failed to cancel booking.");
      }
    }
  });

  // --- Calendar Logic ---
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getDateStatus = (day: Date) => {
    const isPast = isBefore(day, startOfDay(new Date()));
    const isOff = isWeekend(day);
    if (isPast || isOff) return "disabled";
    const dayBookings = bookings.filter(b => isSameDay(parseISO(b.date), day));
    if (dayBookings.length >= TIME_SLOTS.length) return "booked";
    if (dayBookings.length > 0) return "partial";
    return "available";
  };

  // --- Booking Form ---
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: "", phone: "", time: "", package: "Morning" }
  });

  const onSubmit = (data: BookingFormValues) => {
    if (!selectedDate) return;
    createMutation.mutate({
      data: {
        date: format(selectedDate, "yyyy-MM-dd"),
        time: data.time,
        package: data.package,
        name: data.name,
        phone: data.phone
      }
    });
  };

  const availableTimes = useMemo(() => {
    if (!selectedDate) return TIME_SLOTS;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const takenTimes = bookings.filter(b => b.date === dateStr).map(b => b.time);
    return TIME_SLOTS.filter(t => !takenTimes.includes(t));
  }, [selectedDate, bookings]);

  const watchTime = form.watch("time");
  useMemo(() => {
    if (watchTime && !availableTimes.includes(watchTime)) {
      form.setValue("time", "");
    }
  }, [availableTimes, watchTime, form]);

  // --- Admin Login ---
  const handleAdminLogin = async () => {
    setIsVerifying(true);
    setAdminError("");
    try {
      // Verify by attempting a dummy cancel with password — server will confirm or deny
      const res = await fetch("/api/book/-1", {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
      // 404 = password correct (booking not found), 401 = wrong password
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

  return (
    <section id="booking" className="py-24 bg-secondary/20 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Schedule a Lesson</span>
          <h3 className="text-4xl md:text-5xl font-bold font-display text-foreground">Book Your Session</h3>
          <p className="mt-6 text-muted-foreground text-lg max-w-2xl mx-auto">Select an available date below to book your morning or evening package. Start your journey towards confident driving today.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-card rounded-3xl shadow-2xl border border-border/50 p-6 md:p-10"
        >
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
            <h4 className="text-3xl font-bold font-display text-foreground capitalize tracking-tight">{format(currentMonth, "MMMM yyyy")}</h4>
            <div className="flex gap-3">
              <button onClick={prevMonth} className="p-3 rounded-xl hover:bg-secondary transition-all border border-border shadow-sm hover:shadow">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={nextMonth} className="p-3 rounded-xl hover:bg-secondary transition-all border border-border shadow-sm hover:shadow">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-6 mb-8 text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm" /> Partially Booked</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-destructive shadow-sm" /> Fully Booked</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-muted border border-border" /> Off / Past</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3 md:gap-5 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold tracking-wide text-xs uppercase text-muted-foreground py-2">{day}</div>
            ))}
            {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            {daysInMonth.map((day) => {
              const status = getDateStatus(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  disabled={status === "disabled" || status === "booked"}
                  onClick={() => { setSelectedDate(day); setIsModalOpen(true); }}
                  className={cn(
                    "relative h-16 md:h-24 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300",
                    "focus:outline-none focus:ring-4 focus:ring-primary/20",
                    status === "disabled" && "opacity-30 bg-muted/50 border-transparent cursor-not-allowed",
                    status === "available" && "bg-emerald-50/50 border-emerald-200/60 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-1 hover:shadow-lg",
                    status === "partial" && "bg-amber-50/50 border-amber-200/60 text-amber-900 hover:bg-amber-100 hover:border-amber-300 hover:-translate-y-1 hover:shadow-lg",
                    status === "booked" && "bg-destructive/5 border-destructive/10 text-destructive cursor-not-allowed",
                    isSelected && "ring-4 ring-primary/30 border-primary scale-105 shadow-xl bg-primary/5",
                    isToday(day) && "font-black"
                  )}
                >
                  <span className={cn("text-xl md:text-2xl font-display", isToday(day) ? "text-primary" : "")}>{format(day, "d")}</span>
                  {isToday(day) && <div className="absolute bottom-2 md:bottom-3 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary shadow-sm" />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Bookings List */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-3xl font-bold font-display">Upcoming Bookings</h3>
            {!isAdmin ? (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-300 shadow-sm hover:shadow"
              >
                <Lock className="w-4 h-4" /> Admin Access
              </button>
            ) : (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold shadow-sm">
                <ShieldCheck className="w-4 h-4" /> Admin Mode Active
                <div className="w-px h-4 bg-emerald-200 mx-1"></div>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="text-emerald-500 hover:text-emerald-800 transition-colors"
                  title="Logout"
                >
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
              <p className="text-sm mt-2 opacity-70">Be the first to book a lesson for this month.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  key={booking.id} 
                  className="bg-card border border-border/50 p-6 rounded-3xl shadow-md flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                        {booking.package}
                      </span>
                      <span className="text-sm font-bold text-foreground bg-secondary px-3 py-1.5 rounded-lg">{booking.time}</span>
                    </div>
                    <h4 className="font-bold text-xl mb-1">{booking.name}</h4>
                    <p className="text-sm font-medium text-muted-foreground mb-6">{format(parseISO(booking.date), "EEEE, MMMM d, yyyy")}</p>
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

      {/* Booking Modal */}
      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card relative z-10 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-10 border border-border"
            >
              <div className="mb-8 border-b border-border/50 pb-6">
                <h3 className="text-3xl font-bold font-display mb-2">Complete Booking</h3>
                <p className="text-muted-foreground text-lg">
                  For <span className="font-bold text-primary">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                </p>
              </div>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground tracking-wide">Time Slot <span className="text-destructive">*</span></label>
                    <select
                      {...form.register("time")}
                      className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    >
                      <option value="">Select Time</option>
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time} disabled={!availableTimes.includes(time)}>
                          {time} {!availableTimes.includes(time) ? "(Booked)" : ""}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.time && <p className="text-xs font-medium text-destructive">{form.formState.errors.time.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground tracking-wide">Package <span className="text-destructive">*</span></label>
                    <select
                      {...form.register("package")}
                      className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    >
                      <option value="Morning">Morning ($60+)</option>
                      <option value="Evening">Evening ($60+)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground tracking-wide">Full Name <span className="text-destructive">*</span></label>
                  <input
                    {...form.register("name")}
                    placeholder="John Doe"
                    className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                  />
                  {form.formState.errors.name && <p className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground tracking-wide">Phone Number <span className="text-destructive">*</span></label>
                  <input
                    {...form.register("phone")}
                    placeholder="e.g. +61 400 000 000"
                    className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                  />
                  {form.formState.errors.phone && <p className="text-xs font-medium text-destructive">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-xl border border-border font-bold text-foreground hover:bg-secondary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    onChange={(e) => { setAdminPassword(e.target.value); setAdminError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    placeholder="Admin password"
                    className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-foreground focus:bg-background focus:ring-4 focus:ring-foreground/10 transition-all outline-none font-medium pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {adminError && (
                  <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">{adminError}</p>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowAdminLogin(false); setAdminError(""); setAdminPassword(""); }}
                    className="flex-1 py-3.5 rounded-xl border border-border font-bold text-foreground hover:bg-secondary transition-all"
                  >
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

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => { setCancelTarget(null); setCancelError(""); setCancelPassword(""); }} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card relative z-10 w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-border"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold font-display">Cancel Booking</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  Are you sure you want to cancel the booking for <span className="font-bold text-foreground">{cancelTarget.name}</span>?
                </p>
              </div>
              <div className="space-y-5">
                <div className="relative">
                  <input
                    type={cancelPasswordVisible ? "text" : "password"}
                    value={cancelPassword}
                    onChange={(e) => { setCancelPassword(e.target.value); setCancelError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleCancelConfirm()}
                    placeholder="Admin password to confirm"
                    className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-destructive focus:bg-background focus:ring-4 focus:ring-destructive/10 transition-all outline-none font-medium pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setCancelPasswordVisible(!cancelPasswordVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cancelPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {cancelError && (
                  <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">{cancelError}</p>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setCancelTarget(null); setCancelError(""); setCancelPassword(""); }}
                    className="flex-1 py-3.5 rounded-xl border border-border font-bold text-foreground hover:bg-secondary transition-all"
                  >
                    Keep It
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={!cancelPassword || isCancelling}
                    className="flex-1 py-3.5 rounded-xl bg-destructive text-white font-bold shadow-lg shadow-destructive/30 hover:bg-destructive/90 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    Yes, Cancel
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
