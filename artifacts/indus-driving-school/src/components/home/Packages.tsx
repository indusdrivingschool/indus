import { motion } from "framer-motion";
import { Clock, BookOpen, CheckCircle2, Star } from "lucide-react";

export interface PackageItem {
  id: string;
  title: string;
  price: number;
  hours: string;
  logbookHours: number;
  description: string;
  popular?: boolean;
}

export const PACKAGES: PackageItem[] = [
  {
    id: "60min-lesson",
    title: "60 Minutes Lesson",
    price: 65,
    hours: "1 Hour",
    logbookHours: 3,
    description: "Standard 1 hour lesson covering driving skills and logbook topics.",
  },
  {
    id: "1hr-mock-test",
    title: "1 Hour Mock Test",
    price: 70,
    hours: "1 Hour",
    logbookHours: 3,
    description: "Simulated driving test to assess your performance and readiness.",
  },
  {
    id: "2hr-lesson",
    title: "2 Hours Lesson",
    price: 130,
    hours: "2 Hours",
    logbookHours: 6,
    description: "Includes residential driving assessment + extended practice session.",
  },
  {
    id: "2hr-mock-test",
    title: "2 Hrs Mock Test & Full Guidance",
    price: 140,
    hours: "2 Hours",
    logbookHours: 6,
    description: "Full test preparation, routes practice and expert guidance.",
  },
  {
    id: "5-lesson-package",
    title: "5 Lesson Package",
    price: 320,
    hours: "5 Hours",
    logbookHours: 15,
    description: "Best for learners with 50–100 hours experience. Structured progression.",
    popular: true,
  },
  {
    id: "10-lesson-package",
    title: "10 Lesson Package",
    price: 630,
    hours: "10 Hours",
    logbookHours: 30,
    description: "Best for beginners — includes full driving training from the ground up.",
    popular: true,
  },
  {
    id: "test-car-1hr",
    title: "Test Car Hire (1 Hour)",
    price: 200,
    hours: "1 Hour",
    logbookHours: 3,
    description: "Includes test car + 1 hour practice before your driving test.",
  },
  {
    id: "test-car-2hr",
    title: "Test Car Hire (2 Hours)",
    price: 260,
    hours: "2 Hours",
    logbookHours: 6,
    description: "Includes test car + 2 hours of focused pre-test practice.",
  },
];

interface PackagesProps {
  onBookNow: (pkg: PackageItem) => void;
}

export function Packages({ onBookNow }: PackagesProps) {
  return (
    <section id="packages" className="py-24 bg-background relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Transparent Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground">Packages & Prices</h2>
          <p className="mt-6 text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the package that suits your experience level. All lessons include professional instruction and count towards your logbook hours.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`relative flex flex-col rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group ${
                pkg.popular
                  ? "bg-primary text-white border-primary shadow-xl shadow-primary/25"
                  : "bg-card border-border/60 hover:border-primary/30 shadow-md"
              }`}
            >
              {/* Popular badge */}
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-primary text-xs font-black uppercase tracking-widest shadow-lg">
                    <Star className="w-3 h-3 fill-primary" /> Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Title */}
                <h3 className={`font-bold font-display text-lg leading-tight mb-4 ${pkg.popular ? "text-white" : "text-foreground"}`}>
                  {pkg.title}
                </h3>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black font-display ${pkg.popular ? "text-white" : "text-primary"}`}>
                      ${pkg.price}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider mt-1 block ${pkg.popular ? "text-white/70" : "text-muted-foreground"}`}>
                    per booking
                  </span>
                </div>

                {/* Stats */}
                <div className={`flex flex-col gap-2 mb-5 pb-5 border-b ${pkg.popular ? "border-white/20" : "border-border/50"}`}>
                  <div className={`flex items-center gap-2.5 text-sm font-semibold ${pkg.popular ? "text-white/90" : "text-foreground"}`}>
                    <Clock className={`w-4 h-4 flex-shrink-0 ${pkg.popular ? "text-white/70" : "text-primary"}`} />
                    {pkg.hours} lesson
                  </div>
                  <div className={`flex items-center gap-2.5 text-sm font-semibold ${pkg.popular ? "text-white/90" : "text-foreground"}`}>
                    <BookOpen className={`w-4 h-4 flex-shrink-0 ${pkg.popular ? "text-white/70" : "text-primary"}`} />
                    {pkg.logbookHours} Logbook Hours
                  </div>
                </div>

                {/* Description */}
                <div className={`flex items-start gap-2.5 mb-6 flex-1 ${pkg.popular ? "text-white/85" : "text-muted-foreground"}`}>
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.popular ? "text-white/60" : "text-primary/60"}`} />
                  <p className="text-sm leading-relaxed">{pkg.description}</p>
                </div>

                {/* Book Now Button */}
                <button
                  onClick={() => onBookNow(pkg)}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${
                    pkg.popular
                      ? "bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20"
                      : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl"
                  }`}
                >
                  Book Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          All prices are in AUD. Payment via bank transfer to <strong className="text-foreground">0426826282</strong>.
          Contact us for custom packages.
        </motion.p>
      </div>
    </section>
  );
}
