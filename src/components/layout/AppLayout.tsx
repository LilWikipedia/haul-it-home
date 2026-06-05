import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Home, PlusCircle, User, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/yeehaul-logo.png";
import HaulerLocationBroadcaster from "@/components/HaulerLocationBroadcaster";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { userRole, signOut } = useAuth();
  const location = useLocation();

  const userNav = [
    { href: "/dashboard",   icon: Home,        label: "Dashboard" },
    { href: "/request/new", icon: PlusCircle,  label: "New Haul"  },
    { href: "/history",     icon: History,     label: "History"   },
    { href: "/profile",     icon: User,        label: "Profile"   },
  ];

  const haulerNav = [
    { href: "/dashboard", icon: Home,    label: "Jobs"    },
    { href: "/history",   icon: History, label: "History" },
    { href: "/profile",   icon: User,    label: "Profile" },
  ];

  const nav = userRole === "hauler" ? haulerNav : userNav;

  return (
    <div className="min-h-screen bg-background">
      <HaulerLocationBroadcaster />

      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border/60">
        {/* Orange accent stripe at very top */}
        <div className="h-0.5 bg-gradient-orange w-full" />

        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group">
            <img src={logo} alt="YeeHaul" className="h-8 w-8 group-hover:scale-105 transition-transform" width={32} height={32} />
            <span className="font-extrabold font-['Space_Grotesk'] text-gradient-orange">YeeHaul</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {nav.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-primary text-white shadow-orange"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold capitalize px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/15 rounded-full transition-colors"
              aria-label="View profile"
            >
              <User className="h-3 w-3" />
              {userRole}
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-8">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/60 z-50 md:hidden">
        {/* Orange accent at top of bottom nav */}
        <div className="h-px bg-gradient-orange w-full" />
        <div className="flex items-center justify-around py-2 px-2">
          {nav.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
