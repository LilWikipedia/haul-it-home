import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Package, MessageSquare, ArrowRight, Send, Star } from "lucide-react";
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
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<HaulRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

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
  }, [id, user]);

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
  const canAdvance = isHauler && !["open", "delivered", "cancelled"].includes(request.status);

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

        {/* Status progress */}
        {request.status !== "open" && request.status !== "cancelled" && (
          <div className="flex items-center gap-1">
            {statusFlow.map((s, i) => {
              const currentIdx = statusFlow.indexOf(request.status as any);
              const done = i <= currentIdx;
              return (
                <div key={s} className={`h-2 flex-1 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
              );
            })}
          </div>
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

        {/* Hauler actions */}
        {canAdvance && (() => {
          const currentIdx = statusFlow.indexOf(request.status as any);
          const nextStatus = statusFlow[currentIdx + 1];
          return (
            <Button className="w-full gap-2" onClick={advanceStatus}>
              Mark as: {statusLabels[nextStatus]} <ArrowRight className="h-4 w-4" />
            </Button>
          );
        })()}

        {isOwner && request.status === "open" && (
          <Button variant="destructive" className="w-full" onClick={cancelRequest}>
            Cancel Request
          </Button>
        )}

        {/* Review section */}
        {request.status === "delivered" && canChat && !hasReviewed && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Leave a Review</CardTitle>
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

        {/* Chat */}
        {canChat && request.status !== "open" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
                {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>}
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
                <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1" />
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
