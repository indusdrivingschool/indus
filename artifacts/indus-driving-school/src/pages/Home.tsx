import { useState, useCallback } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/home/Hero";
import { About } from "../components/home/About";
import { BookingCalendar } from "../components/home/BookingCalendar";
import { Contact } from "../components/home/Contact";
import { Packages } from "../components/home/Packages";

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
        <BookingCalendar preselectedPackage={preselectedPackage} onClearPreselected={() => setPreselectedPackage(null)} />
        <About />
      <Contact />
        <section className="w-full px-4 py-8 bg-white">
       <div className="max-w-5xl mx-auto">
         <img
      src="/transport-nsw-notice.png"
      alt="Transport for NSW misconduct reporting notice"
      className="block w-full h-auto mx-auto"
      loading="lazy"
    />
  </div>
</section>
      </main>
      <Footer />
    </div>
  );
}
