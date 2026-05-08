// src/components/layout/main-layout.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../ui/button";
import { NotificationsPanel } from "../notifications-panel";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  Bell,
  Compass,
  PlusCircle,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import Navbar from "../../pages/landing/components/Navbar";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3, requiresAuth: true },
  { path: "/explore",   label: "Explore",   icon: Compass,    requiresAuth: true },
  { path: "/create",    label: "Create",     icon: PlusCircle, requiresAuth: false },
  { path: "/profile",   label: "Profile",    icon: User,       requiresAuth: true },
];

export function MainLayout() {
  const { user, profile, signOut, isLoading } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]       = useState(false);
  const [scrolled, setScrolled]                   = useState(false);
  const [isFullscreen, setIsFullscreen]           = useState(false);

  // ── Fullscreen detection ──────────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Leave-session guard (kept for main layout logout flow, but host page handles its own) ──
  const hostMatch     = location.pathname.match(/\/session\/([^/]+)\/host/);
  const hostSessionId = hostMatch ? hostMatch[1] : null;
  const isHosting     = !!hostSessionId;

  // Refs for keepalive fetch (beforeunload) and transition watcher
  const authTokenRef     = useRef<string | null>(null);
  const hostSessionIdRef = useRef<string | null>(null);
  const prevIsHostingRef = useRef(false);
  const prevSessionIdRef = useRef<string | null>(null);

  // Keep hostSessionIdRef in sync
  useEffect(() => {
    hostSessionIdRef.current = hostSessionId;
  }, [hostSessionId]);

  // Cache auth token while hosting so it's available in beforeunload
  useEffect(() => {
    if (!isHosting) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      authTokenRef.current = session?.access_token ?? null;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { authTokenRef.current = session?.access_token ?? null; }
    );
    return () => subscription.unsubscribe();
  }, [isHosting]);

  // ── Keepalive session ender (used in beforeunload — page is closing) ──────
  const endSessionKeepAlive = useCallback((sessionId: string) => {
    const url   = (supabase as any).supabaseUrl as string;
    const key   = (supabase as any).supabaseKey as string;
    const token = authTokenRef.current ?? key;

    fetch(`${url}/rest/v1/sessions?id=eq.${sessionId}`, {
      method:    "PATCH",
      keepalive: true,
      headers: {
        "apikey":        key,
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
      },
      body: JSON.stringify({ status: "ENDED" }),
    });
  }, []);

  // ── Watch for any navigation away from host page (back/forward/navbar) ────
  useEffect(() => {
    if (prevIsHostingRef.current === true && !isHosting && prevSessionIdRef.current) {
      const sessionId = prevSessionIdRef.current;
      (async () => {
        try {
          await supabase
            .from("sessions")
            .update({ status: "ENDED" })
            .eq("id", sessionId);
        } catch (err: unknown) {
          console.error("Failed to end session on navigate away:", err);
        }
      })();
    }
    prevIsHostingRef.current = isHosting;
    prevSessionIdRef.current = hostSessionId;
  }, [isHosting, hostSessionId]);

  // ── Tab close / refresh / URL-bar navigation → keepalive end + warning ────
  useEffect(() => {
    if (!isHosting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const sessionId = hostSessionIdRef.current;
      if (sessionId) endSessionKeepAlive(sessionId);

      e.preventDefault();
      e.returnValue = "You are currently hosting a session. Leaving will end it for all participants.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isHosting, endSessionKeepAlive]);

  // ── Get visible navigation items based on authentication ─────────────────
  const getVisibleNavItems = () => {
    if (user) {
      return navItems;
    } else {
      return navItems.filter(item => !item.requiresAuth);
    }
  };

  const visibleNavItems = getVisibleNavItems();

  // ── Check if we're on audience participation page ────────────────────────
  const isAudienceParticipation = location.pathname === "/audience-participation";
  const isHostPage = location.pathname.endsWith("/host");
  
  const shouldRedirectToAuth = !isLoading && !user && !isAudienceParticipation;

  useEffect(() => {
    if (shouldRedirectToAuth) {
      navigate("/auth", { replace: true });
    }
  }, [shouldRedirectToAuth, navigate]);

  // Scroll handling for authenticated navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isCreatePage    = location.pathname === "/create";
  const isCreateProcess = location.pathname.startsWith("/create");
  // Hide navbar when a participant has joined a session (URL has ?code=...)
  const isParticipantInSession = location.pathname === "/audience-participation" && !!searchParams.get("code");

  // Don't render anything if we're loading or should redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary rounded-full animate-[slide_1s_ease-in-out_infinite]" />
        </div>
        <p className="text-muted-foreground text-sm mt-4">Loading...</p>
      </div>
    );
  }

  // For audience participation, we render even without user
  // For other routes, we need user
  if (!user && !isAudienceParticipation) return null;

  const displayName   = profile?.name       || user?.user_metadata?.name       || user?.email?.split("@")[0] || "User";
  const displayRole   = profile?.role       || "USER";
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`;

  // Render authenticated navbar (existing design with Syncra logo)
  const renderAuthNavbar = () => (
    <nav className="sticky top-0 z-40 w-full transition-all duration-700">
      <div
        className={cn(
          "w-full transition-all duration-700",
          scrolled
            ? "bg-background/95 backdrop-blur-xl border-b shadow-sm"
            : "bg-background"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo - Syncra */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500">
                <svg
                  viewBox="16 6 70 89"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid meet"
                  className="fill-primary"
                >
                  <path d="M52.0032727,91.1841818 L45.484,84.6649091 L85.3654545,84.6649091 L85.3654545,17.5625455 L80.836,17.5625455 L80.836,80.1354545 L45.484,80.1354545 L52.0032727,73.6161818 L48.8009091,70.4138182 L36.8161818,82.4001818 L48.8009091,94.3865455 L52.0032727,91.1841818 L52.0032727,91.1841818 Z M55.7456364,19.8272727 L48.8009091,26.7703636 L52.0032727,29.9727273 L63.9912727,17.988 L52.0032727,6 L48.8009091,9.20236364 L54.8963636,15.2994545 L16,15.2994545 L16,82.4001818 L20.5278182,82.4001818 L20.5278182,19.8272727 L55.7456364,19.8272727 L55.7456364,19.8272727 Z" />
                </svg>
              </div>
              <span className="font-heading font-bold text-xl text-foreground">Syncra</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {visibleNavItems.map((item) => {
                const Icon     = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 px-3 py-2 rounded-full",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Right Side - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="h-8 w-8 rounded-full ring-2 ring-primary/10 object-cover"
                />
                <div className="text-sm hidden lg:block">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {displayRole.toLowerCase()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try { await signOut(); } catch {}
                    window.location.href = "/auth";
                  }}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary/10 text-primary"
                  )}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(item.path);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
            
            <div className="pt-4 border-t mt-4">
              <div className="flex items-center gap-3 px-4 py-3">
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="text-sm">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {displayRole.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={async () => {
                try { await signOut(); } catch {}
                window.location.href = "/auth";
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Navigation — hidden on host page and fullscreen and participant session ── */}
      {!isCreateProcess && !isFullscreen && !isParticipantInSession && !isHostPage && (
        user ? renderAuthNavbar() : <Navbar variant="audience" />
      )}

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer — only show for authenticated users or non-fullscreen, and NOT on host page */}
      {!isCreatePage && !isHostPage && !isFullscreen && user && (
        <footer className="border-t py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2026 Syncra. All rights reserved.</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <Link to="/terms"    className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy"  className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/contact"  className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/help"     className="hover:text-foreground transition-colors">Help Center</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}