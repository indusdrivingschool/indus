import { useState, useCallback } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/home/Hero";
import { About } from "../components/home/About";
import { BookingCalendar } from "../components/home/BookingCalendar";
import { Contact } from "../components/home/Contact";
import { Packages } from "../components/home/Packages";
import type { PackageItem } from "../components/home/Packages"; // ✅ FIX

export default function Home() {
  const [preselectedPackage, setPreselectedPackage] = useState<PackageItem | null>(null);

  const handlePackageBookNow = useCallback((pkg: PackageItem) => {
    setPreselectedPackage(pkg);
    setTimeout(() => {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main>
        <Hero />
        <Packages onBookNow={handlePackageBookNow} />
        <BookingCalendar
          preselectedPackage={preselectedPackage}
          onClearPreselected={() => setPreselectedPackage(null)}
        />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
