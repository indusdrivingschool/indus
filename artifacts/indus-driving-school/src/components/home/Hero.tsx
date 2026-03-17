import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop"
          alt="Modern car steering wheel"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center md:items-start text-center md:text-left text-white"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white/90">
            ⭐ Trusted by 500+ Students
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-6xl lg:text-7xl font-bold font-display max-w-3xl leading-[1.1] mb-6"
        >
          Learn to Drive with <br className="hidden md:block"/>
          <span className="text-primary italic font-medium">Confidence</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-white/80 max-w-2xl font-light leading-relaxed mb-10"
        >
          Professional certified instructor with 13 years of bus driving experience helping all types of learners build new skills safely.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <a
            href="#booking"
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-primary/40 hover:bg-primary/90 hover:-translate-y-1 transition-all"
          >
            Book Your Lesson
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#about"
            className="flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
          >
            Learn More
          </a>
        </motion.div>
      </motion.div>

      {/* Floating stats bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 hidden md:flex justify-between items-center divide-x divide-white/20 shadow-2xl z-20"
      >
        <div className="px-6 text-center flex-1">
          <p className="text-3xl font-display font-bold text-white mb-1">13+</p>
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Years Experience</p>
        </div>
        <div className="px-6 text-center flex-1">
          <p className="text-3xl font-display font-bold text-white mb-1">500+</p>
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Students Trained</p>
        </div>
        <div className="px-6 text-center flex-1">
          <p className="text-lg font-bold text-white mb-1">Blacktown & Penrith</p>
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Service Areas</p>
        </div>
      </motion.div>

      {/* Decorative gradient overlay at bottom to blend with next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
}
