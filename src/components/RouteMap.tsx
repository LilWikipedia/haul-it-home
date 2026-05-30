import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

type LatLng = { lat: number; lng: number };

type Props = {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  hauler?: LatLng | null;
  className?: string;
};

const RouteMap = ({ pickup, dropoff, hauler, className }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center: pickup || dropoff || hauler || { lat: 39.8283, lng: -98.5795 },
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
          });
        }
        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        const addMarker = (pos: LatLng, label: string, color: string) => {
          const marker = new google.maps.Marker({
            position: pos,
            map: mapRef.current,
            label: { text: label, color: "#fff", fontWeight: "bold", fontSize: "12px" },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
          markersRef.current.push(marker);
          bounds.extend(pos);
        };

        if (pickup) addMarker(pickup, "P", "#16a34a");
        if (dropoff) addMarker(dropoff, "D", "#dc2626");
        if (hauler) addMarker(hauler, "H", "#2563eb");

        const count = [pickup, dropoff, hauler].filter(Boolean).length;
        if (count > 1) {
          mapRef.current.fitBounds(bounds, 60);
        } else if (count === 1) {
          mapRef.current.setCenter(pickup || dropoff || hauler);
          mapRef.current.setZoom(14);
        }
      })
      .catch((e) => console.warn("Map load failed:", e));
    return () => {
      cancelled = true;
    };
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, hauler?.lat, hauler?.lng]);

  return <div ref={containerRef} className={className || "w-full h-full"} />;
};

export default RouteMap;
