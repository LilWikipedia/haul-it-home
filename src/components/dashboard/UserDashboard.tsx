import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Package, MapPin, Clock } from "lucide-react";

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

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  claimed: "bg-yellow-100 text-yellow-700",
  en_route_pickup: "bg-orange-100 text-orange-700",
  at_pickup: "bg-orange-100 text-orange-700",
  in_transit: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HaulRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from("haul_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests((data as HaulRequest[]) || []);
      setLoading(false);
    };
    fetchRequests();

    const channel = supabase
      .channel("user-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "haul_requests", filter: `user_id=eq.${user.id}` }, () => fetchRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const activeRequests = requests.filter((r) => !["delivered", "cancelled"].includes(r.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Hauls</h1>
          <p className="text-muted-foreground text-sm">{activeRequests.length} active request{activeRequests.length !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/request/new">
          <Button className="gap-2"><PlusCircle className="h-4 w-4" /> New Haul</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No hauls yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Post your first haul request to get started</p>
            <Link to="/request/new">
              <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Create Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} to={`/request/${req.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={statusColors[req.status]}>
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                        {req.estimated_price && (
                          <span className="text-sm font-semibold text-primary">${Number(req.estimated_price).toFixed(2)}</span>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{req.item_description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.pickup_address}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
