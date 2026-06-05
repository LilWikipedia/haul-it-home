import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Truck, Lock, ArrowRight, Zap } from "lucide-react";
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
  payment_status: string;
};

const sizeLabels: Record<string, { short: string; color: string }> = {
  small:       { short: "S",  color: "bg-green-100 text-green-700 border-green-200" },
  medium:      { short: "M",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  large:       { short: "L",  color: "bg-orange-100 text-orange-700 border-orange-200" },
  extra_large: { short: "XL", color: "bg-red-100 text-red-700 border-red-200" },
};

const HaulerDashboard = () => {
  const { user } = useAuth();
  const [openJobs, setOpenJobs] = useState<HaulRequest[]>([]);
  const [myJobs, setMyJobs]     = useState<HaulRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) { setLoading(false); return; }

    const [{ data: open, error: openErr }, { data: mine, error: mineErr }] = await Promise.all([
      supabase.from("haul_requests").select("*").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("haul_requests").select("*").eq("hauler_id", user.id).neq("status", "delivered").neq("status", "cancelled").order("created_at", { ascending: false }),
    ]);

    if (openErr) console.error("open jobs error", openErr);
    if (mineErr) console.error("my jobs error", mineErr);
    setOpenJobs((open as HaulRequest[]) || []);
    setMyJobs((mine as HaulRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const channel = supabase
      .channel("hauler-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "haul_requests" }, fetchJobs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.success("Job claimed! Waiting for customer payment.");
      fetchJobs();
    }
    setClaiming(null);
  };

  return (
    <div className="space-y-8">

      {/* ── My active jobs ── */}
      {myJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Active Jobs</h2>
          {myJobs.map((job) => (
            <Link key={job.id} to={`/request/${job.id}`}>
              <div className="group bg-card border border-primary/30 rounded-2xl p-4 hover:shadow-orange transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
                      {job.status.replace(/_/g, " ")}
                    </Badge>
                    {job.payment_status !== "paid" && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1 text-xs">
                        <Lock className="h-2.5 w-2.5" /> Awaiting payment
                      </Badge>
                    )}
                  </div>
                  {job.estimated_price && (
                    <span className="font-bold text-primary">${Number(job.estimated_price).toFixed(2)}</span>
                  )}
                </div>
                <p className="font-semibold text-sm mb-2">{job.item_description}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-green-500" />{job.pickup_address}
                  <span className="mx-1">→</span>
                  <MapPin className="h-3 w-3 text-red-500" />{job.dropoff_address}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Open jobs feed ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Available Jobs
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Claim a job to get started</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : openJobs.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Truck className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold mb-1">No open jobs right now</h3>
            <p className="text-sm text-muted-foreground">Check back soon — new haul requests come in regularly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openJobs.map((job) => {
              const size = sizeLabels[job.size_category];
              return (
                <div key={job.id} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-warm transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {size && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${size.color}`}>
                            {size.short}
                          </span>
                        )}
                        {job.estimated_price && (
                          <span className="flex items-center gap-0.5 text-sm font-bold text-primary">
                            <DollarSign className="h-3 w-3" />{Number(job.estimated_price).toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {new Date(job.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="font-semibold text-sm mb-2">{job.item_description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                        <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{job.pickup_address}</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{job.dropoff_address}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => claimJob(job.id)}
                      disabled={claiming === job.id}
                      className="bg-gradient-orange shadow-orange font-semibold shrink-0"
                    >
                      {claiming === job.id ? "Claiming..." : "Claim"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HaulerDashboard;
