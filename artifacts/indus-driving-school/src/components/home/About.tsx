import { motion } from "framer-motion";
import { ShieldCheck, Award, CalendarClock, CheckCircle } from "lucide-react";

export function About() {
  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: "Safety First",
      description: "Our dual-control vehicles and meticulous safety protocols ensure you learn in a completely secure environment."
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "Expert Guidance",
      description: "Learn from a certified professional with 13+ years of heavy vehicle experience, teaching best practices from day one."
    },
    {
      icon: <CalendarClock className="w-8 h-8 text-primary" />,
      title: "Flexible Scheduling",
      description: "Morning and evening packages designed to fit your busy lifestyle, available all weekdays."
    }
  ];

  return (
    <section id="about" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
              Why Choose Us
            </span>
            <h3 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-6 leading-tight">
              Drive with Confidence, <br/> Learn with Experts
            </h3>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              At Indus Driving School, we believe that becoming a safe driver is about more than just passing a test. It's about developing lifelong skills and confidence behind the wheel.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Whether you are a nervous beginner, an international license holder adapting to Australian roads, or just looking to polish your skills, our instructor brings <strong>13 years of professional bus driving experience</strong> to provide patient, structured, and highly effective lessons.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {['Beginner Drivers', 'Nervous Learners', 'Test Preparation', 'Overseas Conversion'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>

            {/* Instructor Highlight Strip */}
            <div className="bg-foreground text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-foreground flex items-center justify-center z-20">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-foreground flex items-center justify-center z-10">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="font-bold text-lg font-display">13 Years Experience</p>
                <p className="text-sm text-white/70">Bus & Car Certified • All Learner Types</p>
              </div>
            </div>

          </motion.div>

          <div className="grid gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-2 font-display">{feature.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
