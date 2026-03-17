import { useState, useMemo } from "react";
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
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
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

  // --- API Hooks ---
  const { data: bookings = [], isLoading: isLoadingBookings } = useGetBookings();
  
  const createMutation = useCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
        toast({ title: "Booking Confirmed", description: "Your lesson has been successfully booked!", variant: "default" });
        setIsModalOpen(false);
        form.reset();
      },
      onError: (err) => {
        toast({ 
          title: "Booking Failed", 
          description: err.error || "This slot might be taken. Please try another.", 
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
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to cancel booking", variant: "destructive" });
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

  // Determine date availability
  const getDateStatus = (day: Date) => {
    const isPast = isBefore(day, startOfDay(new Date()));
    const isOff = isWeekend(day);
    
    if (isPast || isOff) return "disabled";
    
    const dayBookings = bookings.filter(b => isSameDay(parseISO(b.date), day));
    
    // If all slots are taken, it's fully booked. Otherwise available.
    // For simplicity, we just mark it as "booked" (red) if ANY booking exists to satisfy the prompt,
    // or we can mark it partially booked. The prompt says "Available (green), Booked (red)".
    // Let's mark it 'available' if slots are free, 'booked' if full.
    if (dayBookings.length >= TIME_SLOTS.length) return "booked";
    if (dayBookings.length > 0) return "partial"; // partially booked
    
    return "available";
  };

  // --- Form Logic ---
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

  // Filter available times for selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate) return TIME_SLOTS;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const takenTimes = bookings.filter(b => b.date === dateStr).map(b => b.time);
    return TIME_SLOTS.filter(t => !takenTimes.includes(t));
  }, [selectedDate, bookings]);

  // Ensure selected time is still available, if not reset
  const watchTime = form.watch("time");
  useMemo(() => {
    if (watchTime && !availableTimes.includes(watchTime)) {
      form.setValue("time", "");
    }
  }, [availableTimes, watchTime, form]);


  return (
    <section id="booking" className="py-24 bg-secondary/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-primary font-bold tracking-wider uppercase text-sm mb-3">Schedule a Lesson</h2>
          <h3 className="text-4xl font-bold text-foreground">Book Your Session</h3>
          <p className="mt-4 text-muted-foreground">Select an available date below to book your morning or evening package.</p>
        </div>

        <div className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border p-6 md:p-8">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-2xl font-bold font-display text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h4>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors border border-border">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors border border-border">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400" /> Partially Booked</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /> Fully Booked</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-muted border border-border" /> Off / Past</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Empty slots for first week offset */}
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
                  onClick={() => {
                    setSelectedDate(day);
                    setIsModalOpen(true);
                  }}
                  className={cn(
                    "relative h-14 md:h-20 rounded-xl border flex flex-col items-center justify-center transition-all",
                    "hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    status === "disabled" && "opacity-40 bg-muted border-border cursor-not-allowed hover:translate-y-0 hover:shadow-none",
                    status === "available" && "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300",
                    status === "partial" && "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300",
                    status === "booked" && "bg-destructive/10 border-destructive/20 text-destructive cursor-not-allowed hover:translate-y-0 hover:shadow-none",
                    isSelected && "ring-2 ring-primary ring-offset-2 scale-105 shadow-md",
                    isToday(day) && "font-black"
                  )}
                >
                  <span className="text-lg md:text-xl">{format(day, "d")}</span>
                  {isToday(day) && <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>

        </div>

        {/* Upcoming Bookings List (Simple admin/user view) */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-6">Upcoming Bookings</h3>
          {isLoadingBookings ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : bookings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming bookings found.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-primary/30 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                        {booking.package}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">{booking.time}</span>
                    </div>
                    <h4 className="font-bold text-lg">{booking.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{format(parseISO(booking.date), "EEEE, MMMM d, yyyy")}</p>
                  </div>
                  
                  <button
                    onClick={() => cancelMutation.mutate({ id: booking.id })}
                    disabled={cancelMutation.isPending}
                    className="w-full py-2 px-4 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel Booking
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card relative z-10 w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 border border-border"
          >
            <div className="mb-6 border-b border-border pb-4">
              <h3 className="text-2xl font-bold">Complete Booking</h3>
              <p className="text-muted-foreground mt-1">
                For <span className="font-bold text-primary">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Time Slot <span className="text-destructive">*</span></label>
                  <select 
                    {...form.register("time")}
                    className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  >
                    <option value="">Select Time</option>
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time} disabled={!availableTimes.includes(time)}>
                        {time} {!availableTimes.includes(time) ? "(Booked)" : ""}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.time && <p className="text-xs text-destructive">{form.formState.errors.time.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Package <span className="text-destructive">*</span></label>
                  <select 
                    {...form.register("package")}
                    className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  >
                    <option value="Morning">Morning ($60+)</option>
                    <option value="Evening">Evening ($60+)</option>
                  </select>
                  {form.formState.errors.package && <p className="text-xs text-destructive">{form.formState.errors.package.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Full Name <span className="text-destructive">*</span></label>
                <input 
                  {...form.register("name")}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Phone Number <span className="text-destructive">*</span></label>
                <input 
                  {...form.register("phone")}
                  placeholder="e.g. +61 400 000 000"
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
                {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-border font-bold text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Confirm
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </section>
  );
}
