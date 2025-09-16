import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import FileUpload from "@/pages/FileUpload";
import InteractiveMap from "@/pages/InteractiveMap";
import ClaimsManagement from "@/pages/ClaimsManagement";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/upload" component={FileUpload} />
      <Route path="/map" component={InteractiveMap} />
      <Route path="/claims" component={ClaimsManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <div className="pl-64">
            <Router />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
