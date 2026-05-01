import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function WhatsAppButton() {
  return (
    
      href="https://wa.me/61426826282?text=Hi%2C%20I%20would%20like%20to%20book%20a%20driving%20lesson%20with%20Indus%20Driving%20School."
      target="_blank"
      rel="noreferrer"
      style={{position:"fixed",bottom:"24px",right:"24px",zIndex:9999,width:"62px",height:"62px",backgroundColor:"#25D366",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 25px rgba(37,211,102,0.6)",textDecoration:"none",animation:"wafloat 3s ease-in-out infinite"}}
    >
      <span style={{position:"absolute",inset:0,borderRadius:"50%",backgroundColor:"#25D366",animation:"waping 2s cubic-bezier(0,0,0.2,1) infinite",opacity:0.5}}/>
      <span style={{position:"absolute",inset:0,borderRadius:"50%",backgroundColor:"#25D366",animation:"waping 2s cubic-bezier(0,0,0.2,1) infinite 0.7s",opacity:0.3}}/>
      <svg style={{position:"relative",zIndex:10}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="32" height="32">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <style>{`
        @keyframes waping { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.3);opacity:0} }
        @keyframes wafloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
      `}</style>
    </a>
  );
}

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
