import { MapPin, Phone, Globe, Facebook, Navigation2 } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <div>
            <h2 className="text-primary font-bold tracking-wider uppercase text-sm mb-3">Contact Us</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
              Get in Touch Today
            </h3>
            <p className="text-lg text-muted-foreground mb-10">
              Ready to start your driving journey? Contact us directly or use our booking system. We operate primarily across Blacktown and Penrith areas.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Call Us</h4>
                  <a href="tel:+61426826282" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
                    +61 426 826 282
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Locations</h4>
                  <p className="text-lg font-bold text-foreground">Blacktown, NSW</p>
                  <p className="text-lg font-bold text-foreground">Penrith, NSW</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Website</h4>
                  <a href="https://indusdrivingschool.com.au" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                    indusdrivingschool.com.au
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-border">
                <a 
                  href="https://www.facebook.com/profile.php?id=100078621856875" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-[#1877F2] text-white rounded-xl font-bold shadow-lg shadow-[#1877F2]/30 hover:-translate-y-1 transition-all"
                >
                  <Facebook className="w-5 h-5 fill-current" />
                  Follow us on Facebook
                </a>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-card p-3 rounded-3xl border border-border shadow-xl h-[400px] lg:h-auto relative overflow-hidden group">
            <div className="absolute top-6 right-6 z-10 bg-white p-4 rounded-2xl shadow-lg border border-border flex items-center gap-3 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Navigation2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Service Area</p>
                <p className="text-xs text-muted-foreground">Blacktown & Penrith</p>
              </div>
            </div>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106001.07727409204!2d150.8197775916016!3d-33.77196024479573!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12975c50c05871%3A0x5017d681632a8e0!2sBlacktown%20NSW%2C%20Australia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0, borderRadius: "1.25rem" }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[30%] contrast-[1.1] group-hover:grayscale-0 transition-all duration-700"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
