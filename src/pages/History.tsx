import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Package } from "lucide-react";
import { Link } from "react-router-dom";

type HaulRequest = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  item_description: string;
  status: string;
  estimated_price: number | null;
  created_at: string;
};

const History = () => {
  const { user, userRole } = useAuth();
  const [requests, setRequests] = useState<HaulRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetch = async () => {
      let query = supabase.from("haul_requests").select("*").order("created_at", { ascending: false });
      if (userRole === "hauler") {
        query = query.eq("hauler_id", user.id);
      } else {
        query = query.eq("user_id", user.id);
      }
      query = query.in("status", ["delivered", "cancelled"]);
      const { data, error } = await query;
      if (error) console.error("history fetch error", error);
      setRequests((data as HaulRequest[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user, userRole]);

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">History</h1>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No completed hauls yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} to={`/request/${req.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={req.status === "delivered" ? "default" : "destructive"}>
                      {req.status}
                    </Badge>
                    {req.estimated_price && <span className="font-semibold text-sm">${Number(req.estimated_price).toFixed(2)}</span>}
                  </div>
                  <p className="font-medium text-sm">{req.item_description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.pickup_address}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default History;
