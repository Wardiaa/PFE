// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { MainLayout } from "./components/layout/main-layout";
import Home from "./pages/landing/index";
import AuthPage from "./pages/auth/index";
import Dashboard from "./pages/dashboard/index";
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
      <AuthProvider>
        <Toaster />
        <Routes>
          {/* Home route WITHOUT MainLayout */}
          <Route path="/" element={<Home />} />
          <Route path="auth" element={<AuthPage />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;