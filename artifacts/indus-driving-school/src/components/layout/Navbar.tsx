import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, CarFront } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About Us", href: "#about" },
    { name: "Packages", href: "#packages" },
    { name: "Booking", href: "#booking" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-border/50 shadow-sm py-3"
          : "bg-white/10 backdrop-blur-md border-white/20 py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-2 group focus:outline-none"
          >
            <div className="bg-primary text-white p-2 rounded-xl group-hover:scale-105 transition-transform">
              <CarFront size={24} />
            </div>
            <span
              className={`font-display font-bold text-2xl tracking-tight transition-colors ${
                isScrolled ? "text-foreground" : "text-white drop-shadow-sm"
              }`}
            >
              Indus <span className="text-primary drop-shadow-none">Driving School</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`relative font-medium text-sm transition-colors hover:text-primary group ${
                  isScrolled ? "text-foreground/80" : "text-white/90 drop-shadow-sm"
                }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
            <a
              href="#booking"
              className="px-6 py-2.5 bg-primary text-white font-medium rounded-full shadow-[0_4px_14px_0_rgba(185,28,28,0.39)] hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(185,28,28,0.23)] hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Book Now
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? "text-foreground" : "text-white"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-border overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-foreground font-medium text-lg px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#booking"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 text-center px-6 py-3 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary/90 transition-colors"
              >
                Book Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
