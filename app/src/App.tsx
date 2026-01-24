import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Layout } from "./components/layout";
import NotFound from "./pages/not-found";

// Pages
import Home from "./pages/home";
import Auth from "./pages/auth";
import Dashboard from "./pages/dashboard";
import CreateContext from "./pages/create-context";
import Join from "./pages/join";
import HostSession from "./pages/host-session";
import ParticipantSession from "./pages/participant-session";
import Results from "./pages/results";

// Import QueryClientProvider if you're using React Query
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateContext />} />
        <Route path="/join" element={<Join />} />
        <Route path="/session/:id/host" element={<HostSession />} />
        <Route path="/session/:id" element={<ParticipantSession />} />
        <Route path="/results/:id" element={<Results />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    // If using React Query, wrap with QueryClientProvider
    // <QueryClientProvider client={queryClient}>
    <Router>
      <TooltipProvider>
        <Toaster />
        <AppRoutes />
      </TooltipProvider>
    </Router>
    // </QueryClientProvider>
  );
}

export default App;