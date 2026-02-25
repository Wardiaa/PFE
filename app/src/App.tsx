// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/main-layout";
import Home from "./pages/landing/index";
import Auth from "./pages/auth";
import Dashboard from "./pages/dashboard";
import Create from "./pages/create/index";
import AdminDashboard from "./pages/admin-dashboard";
import HostSession from "./pages/HostSession/index";
import Results from "./pages/results";
import NotFound from "./pages/not-found";
import { Toaster } from "./components/ui/toaster";
import AudienceParticipation from "./pages/audience-participation/index";

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* Home route WITHOUT MainLayout */}
        <Route path="/" element={<Home />} />
        <Route path="auth" element={<Auth />} />
        {/* All other routes WITH MainLayout */}
        <Route element={<MainLayout />}>
          
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create" element={<Create />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="session/:id/host" element={<HostSession />} />
          <Route path="results/:id" element={<Results />} />
          <Route path="audience-participation" element={<AudienceParticipation />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;