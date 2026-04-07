// src/components/layout/main-layout.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
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
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3  },
  { path: "/explore",   label: "Explore",   icon: Compass    },
  { path: "/create",    label: "Create",     icon: PlusCircle },
  { path: "/profile",   label: "Profile",    icon: User       },
];

export function MainLayout() {
  const { user, profile, signOut, isLoading } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]       = useState(false);
  const [scrolled, setScrolled]                   = useState(false);

  // ── Leave-session guard ───────────────────────────────────────────────────
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingPath, setPendingPath]           = useState<string | null>(null);
  const [isEndingSession, setIsEndingSession]   = useState(false);

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

  // ── Async session ender (used when page is alive) ─────────────────────────
  const endSession = useCallback(async (sessionId: string) => {
    try {
      await supabase
        .from("sessions")
        .update({ status: "ENDED" })
        .eq("id", sessionId);
    } catch (err: unknown) {
      console.error("Failed to end session:", err);
    }
  }, []);

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
  // Detects the isHosting true → false transition regardless of how it happened
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

  // ── Navbar / logo clicks → warning modal ─────────────────────────────────
  const requestNavigate = useCallback((path: string) => {
    if (isHosting) {
      setPendingPath(path);
      setShowLeaveWarning(true);
    } else {
      navigate(path);
    }
  }, [isHosting, navigate]);

  const handleStay = () => {
    setShowLeaveWarning(false);
    setPendingPath(null);
  };

  const handleLeaveAndEnd = async () => {
    setIsEndingSession(true);
    if (hostSessionId) await endSession(hostSessionId);
    setIsEndingSession(false);
    setShowLeaveWarning(false);

    if (pendingPath === "__logout__") {
      try { await signOut(); } catch {}
      window.location.href = "/auth";
    } else if (pendingPath) {
      navigate(pendingPath);
    }
    setPendingPath(null);
  };

  const handleLogout = async () => {
    if (isHosting) {
      setPendingPath("__logout__");
      setShowLeaveWarning(true);
      return;
    }
    try { await signOut(); } catch {}
    window.location.href = "/auth";
  };

  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth", { replace: true });
  }, [user, isLoading, navigate]);

  const unreadNotifications = 3;
  const isCreatePage    = location.pathname === "/create";
  const isCreateProcess = location.pathname.startsWith("/create");

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

  if (!user) return null;

  const displayName   = profile?.name       || user.user_metadata?.name       || user.email?.split("@")[0] || "User";
  const displayRole   = profile?.role       || "USER";
  const displayAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Leave-session warning modal ──────────────────────────────────── */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleStay}
          />
          <div className="relative bg-background rounded-2xl shadow-2xl border w-full max-w-md mx-4 overflow-hidden">
            <div className="h-1.5 w-full bg-amber-500" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    You're still hosting a session
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    Leaving this page will{" "}
                    <span className="font-medium text-foreground">end the session</span> and
                    disconnect all participants. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleStay}
                  disabled={isEndingSession}
                >
                  Stay in session
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleLeaveAndEnd}
                  disabled={isEndingSession}
                >
                  {isEndingSession ? "Ending session…" : "End session & leave"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      {!isCreateProcess && (
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

                {/* Logo */}
                <button
                  onClick={() => requestNavigate("/dashboard")}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                    scrolled ? "bg-primary" : "bg-primary/90"
                  )}>
                    <span className="font-black text-white text-sm">E</span>
                  </div>
                  <span className="font-heading font-bold text-xl">Engage</span>
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                  {navItems.map((item) => {
                    const Icon     = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => requestNavigate(item.path)}
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

                {/* Right Side */}
                <div className="flex items-center gap-3">
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

                  <div className="hidden md:flex items-center gap-3">
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
                      onClick={handleLogout}
                      className="rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>

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
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background">
              <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon     = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        requestNavigate(item.path);
                      }}
                      className="w-full"
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
                    </button>
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
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </nav>
      )}

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      {!isCreatePage && (
        <footer className="border-t py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2024 Engage Interactive. All rights reserved.</p>
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