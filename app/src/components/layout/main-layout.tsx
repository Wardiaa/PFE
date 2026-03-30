// src/components/layout/main-layout.tsx
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { NotificationsPanel } from "../notifications-panel";
import { useAuth } from "../../contexts/AuthContext";
import {
  Bell,
  Home,
  Compass,
  PlusCircle,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/explore", label: "Explore", icon: Compass },
  { path: "/create", label: "Create", icon: PlusCircle },
  { path: "/profile", label: "Profile", icon: User },
];

export function MainLayout() {
  const { user, signOut, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  const unreadNotifications = 3; // Mock count
  
  // Check if current route is the create page
  const isCreatePage = location.pathname === "/create";
  // Check if we're in the create process (any step)
  const isCreateProcess = location.pathname.startsWith("/create");

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  
  if (isLoading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-primary rounded-full animate-[slide_1s_ease-in-out_infinite]"></div>
      </div>
      <p className="text-muted-foreground text-sm mt-4">Loading...</p>
    </div>
  );
}

  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation - Hide on create page */}
      {!isCreateProcess && (
        <nav className="sticky top-0 z-40 w-full transition-all duration-700">
          <div 
            className={cn(
              "w-full transition-all duration-700",
              scrolled ? 'bg-background/95 backdrop-blur-xl border-b shadow-sm' : 'bg-background'
            )}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                    scrolled ? 'bg-primary' : 'bg-primary/90'
                  )}>
                    <span className="font-black text-white text-sm">E</span>
                  </div>
                  <span className="font-heading font-bold text-xl">Engage</span>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 px-3 py-2 rounded-full",
                          isActive 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                  {/* Notifications */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </Button>
                  
                  {/* User Menu */}
                  {user && (
                    <div className="hidden md:flex items-center gap-3">
                      <img
                        src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email)}&background=6366f1&color=fff`}
                        alt={user.user_metadata?.full_name || user.email || 'User'}
                        className="h-8 w-8 rounded-full ring-2 ring-primary/10"
                      />
                      <div className="text-sm hidden lg:block">
                        <div className="font-medium">{user.user_metadata?.full_name || user.email?.split('@')[0]}</div>
                        <div className="text-xs text-muted-foreground">Member</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleLogout}
                        className="rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background">
              <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
                {user && (
                  <>
                    <div className="pt-4 border-t mt-4">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <img
                          src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email)}&background=6366f1&color=fff`}
                          alt={user.user_metadata?.full_name || user.email || 'User'}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="text-sm">
                          <div className="font-medium">{user.user_metadata?.full_name || user.email?.split('@')[0]}</div>
                          <div className="text-xs text-muted-foreground">Member</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      )}
      
      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer - Conditionally hide on create page */}
      {!isCreatePage && (
        <footer className="border-t py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2024 Engage Interactive. All rights reserved.</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}