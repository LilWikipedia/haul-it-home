import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Home, PlusCircle, User, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/yeehaul-logo.png";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { userRole, signOut } = useAuth();
  const location = useLocation();

  const userNav = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/request/new", icon: PlusCircle, label: "New Haul" },
    { href: "/history", icon: History, label: "History" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const haulerNav = [
    { href: "/dashboard", icon: Home, label: "Jobs" },
    { href: "/history", icon: History, label: "History" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const nav = userRole === "hauler" ? haulerNav : userNav;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="YeeHaul" className="h-8 w-8" width={32} height={32} />
            <span className="font-bold font-['Space_Grotesk']">YeeHaul</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {nav.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/profile"
              className="text-xs capitalize px-2 py-1 bg-muted hover:bg-muted/70 rounded-full transition-colors"
              aria-label="View profile"
            >
              {userRole}
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {nav.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon className="h-5 w-5" />
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
