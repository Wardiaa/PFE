import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/mock-data";
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-heading font-bold text-2xl tracking-tight bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              EngageHub
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {user && (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/create" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/create') ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Create
                  </Link>
                </>
              )}
              <Link 
                to="/join" 
                className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/join') ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Join Session
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">Log In</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t p-4 bg-background">
            <nav className="flex flex-col gap-4">
              {user && (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link 
                    to="/create" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <PlusCircle className="h-4 w-4" /> Create New
                  </Link>
                </>
              )}
              <Link 
                to="/join" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <UserIcon className="h-4 w-4" /> Join Session
              </Link>
              {user ? (
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                  className="flex items-center gap-2 text-sm font-medium text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">Log In</Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}