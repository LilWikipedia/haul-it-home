import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, MessageSquare, ArrowRight, Send, Star, CreditCard, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import RouteMap from "@/components/RouteMap";

type HaulRequest = {
  id: string;
  user_id: string;
  hauler_id: string | null;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  item_description: string;
  size_category: string;
  status: string;
  estimated_price: number | null;
  timeframe: string;
  created_at: string;
  payment_status: string;
  platform_fee: number | null;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

const statusFlow = ["claimed", "en_route_pickup", "at_pickup", "in_transit", "delivered"] as const;
const statusLabels: Record<string, string> = {
  open: "Waiting for Hauler",
  claimed: "Hauler Claimed",
  en_route_pickup: "En Route to Pickup",
  at_pickup: "At Pickup Location",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const RequestDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<HaulRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [payingNow, setPayingNow] = useState(false);
  const [rating, setRating] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [haulerLoc, setHaulerLoc] = useState<{ lat: number; lng: number } | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  // Handle Stripe redirect back
  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    if (paymentResult === "success") {
      toast.success("Payment confirmed! Your haul is underway.");
      setSearchParams({}, { replace: true });
    } else if (paymentResult === "cancelled") {
      toast.info("Payment cancelled. Your haul is on hold until payment is completed.");
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequest = async () => {
    const { data } = await supabase.from("haul_requests").select("*").eq("id", id).maybeSingle();
    setRequest(data as HaulRequest | null);
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from("messages").select("*").eq("request_id", id).order("created_at");
    setMessages((data as Message[]) || []);
  };

  const checkReview = async () => {
    if (!user || !id) return;
    const { data } = await supabase.from("reviews").select("id").eq("request_id", id).eq("reviewer_id", user.id).maybeSingle();
    setHasReviewed(!!data);
  };

  useEffect(() => {
    fetchRequest();
    fetchMessages();
    checkReview();

    const reqChannel = supabase
      .channel(`request-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "haul_requests", filter: `id=eq.${id}` }, () => fetchRequest())
      .subscribe();

    const msgChannel = supabase
      .channel(`messages-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${id}` }, () => fetchMessages())
      .subscribe();

    return () => {
      supabase.removeChannel(reqChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to hauler live location once we know the hauler_id and job is active
  useEffect(() => {
    if (!request?.hauler_id) return;
    const active = ["claimed", "en_route_pickup", "at_pickup", "in_transit"].includes(request.status);
    if (!active) return;

    let cancelled = false;
    supabase
      .from("hauler_locations")
      .select("lat,lng")
      .eq("user_id", request.hauler_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setHaulerLoc({ lat: data.lat, lng: data.lng });
      });

    const ch = supabase
      .channel(`hauler-loc-${request.hauler_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hauler_locations", filter: `user_id=eq.${request.hauler_id}` },
        (payload) => {
          const n = payload.new as any;
          if (n) setHaulerLoc({ lat: n.lat, lng: n.lng });
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [request?.hauler_id, request?.status]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    await supabase.from("messages").insert({ request_id: id, sender_id: user.id, content: newMessage.trim() });
    setNewMessage("");
  };

  const advanceStatus = async () => {
    if (!request) return;
    const currentIdx = statusFlow.indexOf(request.status as any);
    if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[currentIdx + 1];
    await supabase.from("haul_requests").update({ status: nextStatus as any }).eq("id", request.id);
    toast.success(`Status updated to: ${statusLabels[nextStatus]}`);
  };

  const handlePayNow = async () => {
    if (!request || !user) return;
    setPayingNow(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            request_id: request.id,
            origin: window.location.origin,
          }),
        }
      );

      const result = await res.json();
      if (result.error) throw new Error(result.error);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setPayingNow(false);
    }
  };

  const submitReview = async () => {
    if (!user || !request || rating === 0) return;
    const revieweeId = user.id === request.user_id ? request.hauler_id : request.user_id;
    if (!revieweeId) return;
    const { error } = await supabase.from("reviews").insert({
      request_id: request.id,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
    });
    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted!");
      setHasReviewed(true);
    }
  };

  const cancelRequest = async () => {
    if (!request) return;
    await supabase.from("haul_requests").update({ status: "cancelled" as any }).eq("id", request.id);
    toast.success("Request cancelled");
  };

  if (loading) return <AppLayout><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}</div></AppLayout>;
  if (!request) return <AppLayout><p>Request not found</p></AppLayout>;

  const isOwner = user?.id === request.user_id;
  const isHauler = user?.id === request.hauler_id;
  const canChat = isOwner || isHauler;
  const isPaid = request.payment_status === "paid";
  const paymentPending = request.payment_status === "pending";
  // Hauler can only advance status if payment is confirmed
  const canAdvance = isHauler && isPaid && !["open", "delivered", "cancelled"].includes(request.status);
  // Show payment banner to the owner when job is claimed but not yet paid
  const needsPayment = isOwner && !["open", "cancelled"].includes(request.status) && !isPaid;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <div>
            <Badge className="mb-2 text-sm">{statusLabels[request.status]}</Badge>
            <h1 className="text-xl font-bold">{request.item_description}</h1>
          </div>
          {request.estimated_price && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Estimated</p>
              <p className="text-2xl font-bold text-primary">${Number(request.estimated_price).toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Status progress bar */}
        {request.status !== "open" && request.status !== "cancelled" && (
          <div className="flex items-center gap-1">
            {statusFlow.map((s, i) => {
              const currentIdx = statusFlow.indexOf(request.status as any);
              const done = i <= currentIdx;
              return <div key={s} className={`h-2 flex-1 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />;
            })}
          </div>
        )}

        {/* ── Payment banner (owner only, when payment is needed) ── */}
        {needsPayment && (
          <Alert className={`border-2 ${paymentPending ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20" : "border-orange-400 bg-orange-50 dark:bg-orange-950/20"}`}>
            <AlertCircle className={`h-4 w-4 ${paymentPending ? "text-yellow-600" : "text-orange-600"}`} />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div>
                <p className={`font-semibold text-sm ${paymentPending ? "text-yellow-800 dark:text-yellow-300" : "text-orange-800 dark:text-orange-300"}`}>
                  {paymentPending ? "Complete your payment" : "Payment required"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {paymentPending
                    ? "You have a checkout session open. Click below to finish paying."
                    : "A hauler has claimed your job. Pay now to confirm and get it moving."}
                </p>
              </div>
              <Button
                size="sm"
                onClick={handlePayNow}
                disabled={payingNow}
                className="shrink-0 gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5" />
                {payingNow ? "Loading..." : `Pay $${Number(request.estimated_price ?? 0).toFixed(2)}`}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Payment confirmed badge (owner) */}
        {isOwner && isPaid && request.status !== "open" && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Payment confirmed</span>
          </div>
        )}

        {/* Hauler — waiting on payment notice */}
        {isHauler && !isPaid && !["open", "cancelled", "delivered"].includes(request.status) && (
          <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
            <Lock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300">
              <span className="font-semibold">Waiting for customer payment.</span> You'll be able to update the job status once payment is confirmed.
            </AlertDescription>
          </Alert>
        )}

        {/* Locations */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-green-100 flex items-center justify-center mt-0.5">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium text-sm">{request.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-red-100 flex items-center justify-center mt-0.5">
                <MapPin className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dropoff</p>
                <p className="font-medium text-sm">{request.dropoff_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        {(request.pickup_lat || request.dropoff_lat || haulerLoc) && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[280px] md:h-[360px]">
                <RouteMap
                  pickup={request.pickup_lat && request.pickup_lng ? { lat: request.pickup_lat, lng: request.pickup_lng } : null}
                  dropoff={request.dropoff_lat && request.dropoff_lng ? { lat: request.dropoff_lat, lng: request.dropoff_lng } : null}
                  hauler={haulerLoc}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hauler: advance status (gated on payment) */}
        {canAdvance && (() => {
          const currentIdx = statusFlow.indexOf(request.status as any);
          const nextStatus = statusFlow[currentIdx + 1];
          return (
            <Button className="w-full gap-2" onClick={advanceStatus}>
              Mark as: {statusLabels[nextStatus]} <ArrowRight className="h-4 w-4" />
            </Button>
          );
        })()}

        {/* Owner: cancel (only when open) */}
        {isOwner && request.status === "open" && (
          <Button variant="destructive" className="w-full" onClick={cancelRequest}>
            Cancel Request
          </Button>
        )}

        {/* Review section (after delivery) */}
        {request.status === "delivered" && canChat && !hasReviewed && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" /> Leave a Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="p-1">
                    <Star className={`h-6 w-6 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Button size="sm" disabled={rating === 0} onClick={submitReview}>Submit Review</Button>
            </CardContent>
          </Card>
        )}

        {/* Chat (available once claimed, for both parties) */}
        {canChat && request.status !== "open" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default RequestDetail;
