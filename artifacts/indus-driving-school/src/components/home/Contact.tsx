import { MapPin, Phone, Mail, Facebook, Navigation2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function Contact() {
  return (
    <section id="contact" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
              Contact Us
            </span>
            <h3 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-8">
              Get in Touch Today
            </h3>
            <p className="text-lg text-muted-foreground mb-10">
              Ready to start your driving journey? Contact us directly or use our booking system. We operate primarily across Blacktown and Penrith areas.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Call Us</h4>
                  <a href="tel:+61426826282" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
                    +61 426 826 282
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Us</h4>
                  <a href="mailto:alipkau@gmail.com" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
                    alipkau@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Locations</h4>
                  <div className="flex gap-3">
                    <span className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold">Blacktown, NSW</span>
                    <span className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold">Penrith, NSW</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border">
                <a 
                  href="https://www.facebook.com/profile.php?id=100078621856875" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] text-white rounded-xl font-bold shadow-lg shadow-[#1877F2]/30 hover:-translate-y-1 transition-all"
                >
                  <Facebook className="w-5 h-5 fill-current" />
                  Follow on Facebook
                </a>
                <a 
                  href="https://wa.me/61426826282?text=Hi%2C%20I%20would%20like%20to%20book%20a%20driving%20lesson%20with%20Indus%20Driving%20School." 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white rounded-xl font-bold shadow-lg shadow-[#25D366]/30 hover:-translate-y-1 transition-all"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }} 
            className="bg-card p-4 rounded-3xl border border-border shadow-2xl h-[400px] lg:h-auto relative overflow-hidden group"
          >
            <div className="absolute top-8 right-8 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-border flex items-center gap-4 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Navigation2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Service Area</p>
                <p className="text-xs text-muted-foreground font-medium">Blacktown & Penrith</p>
              </div>
            </div>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106001.07727409204!2d150.8197775916016!3d-33.77196024479573!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12975c50c05871%3A0x5017d681632a8e0!2sBlacktown%20NSW%2C%20Australia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0, borderRadius: "1.5rem" }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 w-full h-full"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
