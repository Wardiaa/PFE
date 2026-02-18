// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/main-layout";
import Home from "./pages/home";
import Auth from "./pages/auth";
import Dashboard from "./pages/dashboard";
import EnhancedCreate from "./pages/enhanced-create";
import AdminDashboard from "./pages/admin-dashboard";
import HostSession from "./pages/HostSession/index";
import Results from "./pages/results";
import NotFound from "./pages/not-found";
import { Toaster } from "./components/ui/toaster"; // Add this import
import AudienceParticipation from "./pages/audience-participation/index";

function App() {
  return (
    <BrowserRouter>
      <Toaster /> {/* Add Toaster here */}
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create" element={<EnhancedCreate />} />
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