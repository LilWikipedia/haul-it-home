import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const truckIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const Tracking = () => {
  const { id } = useParams();
  const { user, userRole } = useAuth();
  const [haulerLocation, setHaulerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [request, setRequest] = useState<any>(null);
  // Use a ref so the realtime callback always sees the latest haulerId
  // without needing to re-subscribe whenever request changes
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

    // Subscribe to hauler location updates — use ref to avoid stale closure
    const channel = supabase
      .channel(`tracking-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hauler_locations" }, (payload) => {
        const newLoc = payload.new as any;
        // Read hauler_id from ref, not from closed-over `request` state
        if (haulerIdRef.current && newLoc.user_id === haulerIdRef.current) {
          setHaulerLocation({ lat: newLoc.lat, lng: newLoc.lng });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Keep haulerIdRef in sync whenever request loads
  useEffect(() => {
    if (request?.hauler_id) {
      haulerIdRef.current = request.hauler_id;
    }
  }, [request]);

  // If hauler, broadcast location every 10 seconds
  useEffect(() => {
    if (userRole !== "hauler" || !user) return;

    // Track whether a geolocation call is in-flight to prevent pile-up
    let pending = false;

    const updateLocation = () => {
      if (pending) return;
      pending = true;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          await supabase.from("hauler_locations").upsert(
            {
              user_id: user.id,
              lat,
              lng,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
          pending = false;
        },
        (err) => {
          console.warn("Geolocation error:", err);
          pending = false;
        }
      );
    };

    updateLocation();
    const interval = setInterval(updateLocation, 10000);

    return () => {
      clearInterval(interval);
      pending = false;
    };
  }, [user, userRole]);

  const center: [number, number] = haulerLocation
    ? [haulerLocation.lat, haulerLocation.lng]
    : [39.8283, -98.5795]; // US center fallback

  const statusLabels: Record<string, string> = {
    claimed: "Hauler Claimed",
    en_route_pickup: "En Route to Pickup",
    at_pickup: "At Pickup",
    in_transit: "In Transit",
    delivered: "Delivered",
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Live Tracking</h1>
          {request && (
            <Badge>{statusLabels[request.status] || request.status}</Badge>
          )}
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[400px] md:h-[500px]">
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {haulerLocation && (
                  <Marker position={[haulerLocation.lat, haulerLocation.lng]} icon={truckIcon}>
                    <Popup>Hauler's current location</Popup>
                  </Marker>
                )}
                <MapUpdater center={center} />
              </MapContainer>
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
