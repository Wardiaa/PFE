// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/main-layout";
import Home from "./pages/home";
import Auth from "./pages/auth";
import Dashboard from "./pages/dashboard";
import EnhancedCreate from "./pages/enhanced-create";
import AdminDashboard from "./pages/admin-dashboard";
import HostSession from "./pages/host-session";
import ParticipantSession from "./pages/participant-session";
import Join from "./pages/join";
import Results from "./pages/results";
import NotFound from "./pages/not-found";
import { Toaster } from "./components/ui/toaster"; // Add this import

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
          <Route path="session/:id" element={<ParticipantSession />} />
          <Route path="join" element={<Join />} />
          <Route path="results/:id" element={<Results />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;