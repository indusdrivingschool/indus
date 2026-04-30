import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

import NotFound from "./pages/not-found";

import Home from "./pages/Home";

import { MessageCircle } from "lucide-react";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { MessageCircle } from "lucide-react";

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/61426826282?text=Hi%20I%20want%20to%20book%20a%20lesson"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="relative flex items-center justify-center w-14 h-14">

        {/* Smooth pulse ring */}
        <span className="absolute w-full h-full rounded-full bg-[#25D366] opacity-30 animate-[pulse_2s_ease-out_infinite]"></span>

        {/* Glow ring */}
        <span className="absolute w-16 h-16 rounded-full bg-[#25D366] opacity-20 blur-md"></span>

        {/* Main button */}
        <div className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300">
          <MessageCircle className="w-7 h-7" />
        </div>

      </div>
    </a>
  );
}

export default WhatsAppButton;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <WhatsAppButton />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
