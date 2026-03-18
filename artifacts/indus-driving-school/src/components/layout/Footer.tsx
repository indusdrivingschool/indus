import { CarFront, Facebook, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-white pt-16 pb-8 border-t-2 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
              <CarFront size={32} className="text-primary" />
              <span className="font-display font-bold text-2xl tracking-tight">
                Indus <span className="text-primary">Driving School</span>
              </span>
            </div>
            <p className="text-white/60 text-sm max-w-sm leading-relaxed">
              Professional, patient, and expert driving instruction in Blacktown and Penrith. 
              Equipping learners with lifelong skills and confidence on the road.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-bold text-lg">Quick Links</h4>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <a href="#home" className="hover:text-primary transition-colors inline-flex w-fit">Home</a>
              <a href="#about" className="hover:text-primary transition-colors inline-flex w-fit">About Us</a>
              <a href="#booking" className="hover:text-primary transition-colors inline-flex w-fit">Book a Lesson</a>
              <a href="#contact" className="hover:text-primary transition-colors inline-flex w-fit">Contact</a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-bold text-lg">Connect With Us</h4>
            <div className="flex gap-4 mb-4">
              <a 
                href="https://www.facebook.com/profile.php?id=100078621856875" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 bg-white/10 rounded-full hover:bg-[#1877F2] hover:text-white transition-all text-white/80"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://wa.me/61426826282" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 bg-white/10 rounded-full hover:bg-[#25D366] hover:text-white transition-all text-white/80"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
              </a>
            </div>
            <div className="space-y-3 text-sm text-white/60">
              <a href="tel:+61426826282" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone size={16} className="text-primary flex-shrink-0" /> +61 426 826 282
              </a>
              <a href="mailto:alipkau@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail size={16} className="text-primary flex-shrink-0" /> alipkau@gmail.com
              </a>
              <p className="flex items-center gap-2"><MapPin size={16} className="text-primary flex-shrink-0" /> Blacktown & Penrith, NSW</p>
            </div>
          </div>

        </div>
        
        <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Indus Driving School. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
