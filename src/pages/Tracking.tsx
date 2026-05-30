import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RouteMap from "@/components/RouteMap";

const Tracking = () => {
  const { id } = useParams();
  const [haulerLocation, setHaulerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [request, setRequest] = useState<any>(null);
  const haulerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRequest = async () => {
      const { data } = await supabase
        .from("haul_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      setRequest(data);

      if (data?.hauler_id) {
        haulerIdRef.current = data.hauler_id;
        const { data: loc } = await supabase
          .from("hauler_locations")
          .select("*")
          .eq("user_id", data.hauler_id)
          .maybeSingle();
        if (loc) setHaulerLocation({ lat: loc.lat, lng: loc.lng });
      }
    };

    fetchRequest();

    const channel = supabase
      .channel(`tracking-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hauler_locations" }, (payload) => {
        const newLoc = payload.new as any;
        if (haulerIdRef.current && newLoc.user_id === haulerIdRef.current) {
          setHaulerLocation({ lat: newLoc.lat, lng: newLoc.lng });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (request?.hauler_id) haulerIdRef.current = request.hauler_id;
  }, [request]);

  const statusLabels: Record<string, string> = {
    claimed: "Hauler Claimed",
    en_route_pickup: "En Route to Pickup",
    at_pickup: "At Pickup",
    in_transit: "In Transit",
    delivered: "Delivered",
  };

  const pickup = request?.pickup_lat && request?.pickup_lng ? { lat: request.pickup_lat, lng: request.pickup_lng } : null;
  const dropoff = request?.dropoff_lat && request?.dropoff_lng ? { lat: request.dropoff_lat, lng: request.dropoff_lng } : null;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Live Tracking</h1>
          {request && <Badge>{statusLabels[request.status] || request.status}</Badge>}
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[400px] md:h-[500px]">
              <RouteMap pickup={pickup} dropoff={dropoff} hauler={haulerLocation} />
            </div>
          </CardContent>
        </Card>

        {!haulerLocation && (
          <p className="text-sm text-muted-foreground text-center">
            Waiting for hauler location data...
          </p>
        )}
      </div>
    </AppLayout>
  );
};

export default Tracking;
