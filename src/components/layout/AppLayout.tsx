import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Truck, Home, PlusCircle, MapPin, User, History, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { userRole, signOut, user } = useAuth();
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-['Space_Grotesk']">HaulNow</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-muted rounded-full">
              {userRole}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
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
