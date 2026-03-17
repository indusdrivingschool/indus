import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { BookingCalendar } from "@/components/home/BookingCalendar";
import { Contact } from "@/components/home/Contact";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main>
        <Hero />
        <BookingCalendar />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
