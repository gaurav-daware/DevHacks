import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Code2, Trophy, LayoutDashboard, User, LogOut,
  Menu, X, Shield, Zap, Calendar, Route, Medal, Briefcase, Swords, Sparkles, Users2
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/problems", label: "Problems", icon: Code2 },
    { to: "/contests", label: "Contests", icon: Trophy },
    { to: "/daily", label: "Daily", icon: Calendar },
    // { to: "/roadmap", label: "Roadmap", icon: Route },
    { to: "/ai-roadmap", label: "AI Roadmap", icon: Sparkles },
    { to: "/leaderboard", label: "Rankings", icon: Medal },
   // { to: "/interview-kits", label: "Interview", icon: Briefcase },
    { to: "/battle", label: "Battle", icon: Swords },
    { to: "/pair", label: "Pair", icon: Users2 },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#27272a] bg-[#050505]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
          <div className="relative">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-foreground">
            Code<span className="text-primary">Arena</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${isActive(to)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${isActive("/admin")
                ? "text-yellow-400 bg-yellow-400/10"
                : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/5"
                }`}
              data-testid="nav-admin"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </div>

        {/* Right: Auth section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-8 px-3 text-sm"
                  data-testid="user-menu-trigger"
                >
                  <div className="w-6 h-6 rounded-sm bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold font-mono">
                      {user.username[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#121215] border-[#27272a]"
              >
                <div className="px-3 py-2 border-b border-[#27272a]">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="gap-2 cursor-pointer"
                  data-testid="nav-profile"
                >
                  <User className="w-3.5 h-3.5" />
                  Profile
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="gap-2 cursor-pointer text-yellow-400"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-[#27272a]" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer text-destructive"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
                data-testid="nav-login"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/auth?tab=register")}
                data-testid="nav-register"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="mobile-menu-toggle"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#27272a] bg-[#09090b] px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm ${isActive(to) ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-muted-foreground">
                <User className="w-4 h-4" /> Profile
              </Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-destructive w-full">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <Button onClick={() => { navigate("/auth"); setMobileOpen(false); }}
              className="w-full mt-2" size="sm">
              Sign In
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
