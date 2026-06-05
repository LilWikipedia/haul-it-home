import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Package, MapPin, Clock, ArrowRight, Truck } from "lucide-react";

type HaulRequest = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  item_description: string;
  size_category: string;
  status: string;
  estimated_price: number | null;
  created_at: string;
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  open:            { label: "Waiting for hauler", classes: "bg-blue-100 text-blue-700 border-blue-200" },
  claimed:         { label: "Hauler claimed",      classes: "bg-amber-100 text-amber-700 border-amber-200" },
  en_route_pickup: { label: "En route",            classes: "bg-orange-100 text-orange-700 border-orange-200" },
  at_pickup:       { label: "At pickup",           classes: "bg-orange-100 text-orange-700 border-orange-200" },
  in_transit:      { label: "In transit",          classes: "bg-purple-100 text-purple-700 border-purple-200" },
  delivered:       { label: "Delivered ✓",         classes: "bg-green-100 text-green-700 border-green-200" },
  cancelled:       { label: "Cancelled",           classes: "bg-red-100 text-red-600 border-red-200" },
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HaulRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("haul_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) console.error("user requests fetch error", error);
      setRequests((data as HaulRequest[]) || []);
      setLoading(false);
    };
    fetchRequests();

    const channel = supabase
      .channel("user-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "haul_requests", filter: `user_id=eq.${user.id}` }, fetchRequests)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const active = requests.filter((r) => !["delivered", "cancelled"].includes(r.status));
  const past   = requests.filter((r) =>  ["delivered", "cancelled"].includes(r.status));

  return (
    <div className="space-y-6">

      {/* Header + CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Hauls</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {active.length > 0
              ? `${active.length} active haul${active.length !== 1 ? "s" : ""}`
              : "No active hauls right now"}
          </p>
        </div>
        <Link to="/request/new">
          <Button className="gap-2 bg-gradient-orange shadow-orange font-semibold">
            <PlusCircle className="h-4 w-4" /> New Haul
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        /* ── Empty state ── */
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Truck className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2">No hauls yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Got something too big for your car? Post your first haul and a local truck owner will pick it up.
          </p>
          <Link to="/request/new">
            <Button className="gap-2 bg-gradient-orange shadow-orange font-semibold px-6">
              <PlusCircle className="h-4 w-4" /> Post Your First Haul
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* ── Active hauls ── */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active</h2>
              {active.map((req) => (
                <RequestCard key={req.id} req={req} />
              ))}
            </div>
          )}

          {/* ── Past hauls ── */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past</h2>
              {past.map((req) => (
                <RequestCard key={req.id} req={req} muted />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const RequestCard = ({ req, muted = false }: { req: HaulRequest; muted?: boolean }) => {
  const cfg = statusConfig[req.status] ?? { label: req.status, classes: "bg-muted text-muted-foreground border-border" };

  return (
    <Link to={`/request/${req.id}`}>
      <div className={`group bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-orange transition-all duration-200 cursor-pointer ${muted ? "opacity-70 hover:opacity-100" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes}`}>
                {cfg.label}
              </span>
              {req.estimated_price && (
                <span className="text-sm font-bold text-primary">${Number(req.estimated_price).toFixed(2)}</span>
              )}
            </div>
            <p className="font-semibold text-sm truncate">{req.item_description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate max-w-[160px]">
                <MapPin className="h-3 w-3 shrink-0 text-primary/60" /> {req.pickup_address}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" /> {new Date(req.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
        </div>
      </div>
    </Link>
  );
};

export default UserDashboard;
