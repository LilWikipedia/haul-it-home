import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Clock, DollarSign, Truck } from "lucide-react";
import { toast } from "sonner";

type HaulRequest = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  item_description: string;
  size_category: string;
  status: string;
  estimated_price: number | null;
  created_at: string;
  user_id: string;
  hauler_id: string | null;
};

const HaulerDashboard = () => {
  const { user } = useAuth();
  const [openJobs, setOpenJobs] = useState<HaulRequest[]>([]);
  const [myJobs, setMyJobs] = useState<HaulRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    const [{ data: open }, { data: mine }] = await Promise.all([
      supabase.from("haul_requests").select("*").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("haul_requests").select("*").eq("hauler_id", user.id).not("status", "in", "(\"delivered\",\"cancelled\")").order("created_at", { ascending: false }),
    ]);
    setOpenJobs((open as HaulRequest[]) || []);
    setMyJobs((mine as HaulRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const channel = supabase
      .channel("hauler-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "haul_requests" }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const claimJob = async (jobId: string) => {
    if (!user) return;
    setClaiming(jobId);
    const { error } = await supabase
      .from("haul_requests")
      .update({ hauler_id: user.id, status: "claimed" as any })
      .eq("id", jobId)
      .eq("status", "open" as any);
    if (error) {
      toast.error("Failed to claim job");
    } else {
      toast.success("Job claimed!");
      fetchJobs();
    }
    setClaiming(null);
  };

  const sizeLabels: Record<string, string> = {
    small: "S",
    medium: "M",
    large: "L",
    extra_large: "XL",
  };

  return (
    <div className="space-y-8">
      {/* My active jobs */}
      {myJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">My Active Jobs</h2>
          <div className="space-y-3">
            {myJobs.map((job) => (
              <Link key={job.id} to={`/request/${job.id}`}>
                <Card className="border-primary/20 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-primary/10 text-primary">{job.status.replace(/_/g, " ")}</Badge>
                      {job.estimated_price && <span className="font-bold text-primary">${Number(job.estimated_price).toFixed(2)}</span>}
                    </div>
                    <p className="font-medium text-sm">{job.item_description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.pickup_address}</span>
                      <span>→</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.dropoff_address}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Open jobs */}
      <div>
        <h2 className="text-xl font-bold mb-1">Available Jobs</h2>
        <p className="text-sm text-muted-foreground mb-3">Nearby haul requests waiting for a hauler</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : openJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No jobs right now</h3>
              <p className="text-sm text-muted-foreground">Check back soon for new haul requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {openJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{sizeLabels[job.size_category] || job.size_category}</Badge>
                        {job.estimated_price && (
                          <span className="flex items-center gap-1 text-sm font-bold text-primary">
                            <DollarSign className="h-3 w-3" />{Number(job.estimated_price).toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{new Date(job.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-2">{job.item_description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.pickup_address}</span>
                        <span>→</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.dropoff_address}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => claimJob(job.id)} disabled={claiming === job.id}>
                      {claiming === job.id ? "..." : "Claim"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HaulerDashboard;
