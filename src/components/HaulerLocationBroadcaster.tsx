import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const ACTIVE_STATUSES = ["claimed", "en_route_pickup", "at_pickup", "in_transit"];

/**
 * Background GPS broadcaster.
 * Runs whenever a hauler is logged in. Polls for an active claimed job; if found,
 * pushes geolocation to hauler_locations every 15 seconds so users tracking
 * the haul see live position regardless of which page the hauler is on.
 */
const HaulerLocationBroadcaster = () => {
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user || userRole !== "hauler") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let pending = false;
    let active = true;

    const hasActiveJob = async () => {
      const { data } = await supabase
        .from("haul_requests")
        .select("id")
        .eq("hauler_id", user.id)
        .in("status", ACTIVE_STATUSES as any)
        .limit(1);
      return (data?.length ?? 0) > 0;
    };

    const tick = async () => {
      if (pending || !active) return;
      if (!(await hasActiveJob())) return;
      pending = true;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await supabase.from("hauler_locations").upsert(
              {
                user_id: user.id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          } finally {
            pending = false;
          }
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          pending = false;
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    };

    tick();
    const interval = window.setInterval(tick, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user, userRole]);

  return null;
};

export default HaulerLocationBroadcaster;
