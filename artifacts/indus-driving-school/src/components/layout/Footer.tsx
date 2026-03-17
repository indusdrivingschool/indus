import { CarFront } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-white py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
            <CarFront size={28} className="text-primary" />
            <span className="font-display font-bold text-xl tracking-tight">
              Indus <span className="text-primary">Driving School</span>
            </span>
          </div>

          <div className="flex gap-6 text-sm text-white/60">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#booking" className="hover:text-white transition-colors">Booking</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

        </div>
        
        <div className="mt-10 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          <p>&copy; {new Date().getFullYear()} Indus Driving School. All rights reserved.</p>
          <p className="mt-1">Serving Blacktown & Penrith, NSW Australia.</p>
        </div>
      </div>
    </footer>
  );
}
