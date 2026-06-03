// Singleton loader for the Google Maps JS API.
// Loads async with a global callback so google.maps is ready when the promise resolves.

declare global {
  interface Window {
    google: any;
    __initGoogleMaps?: () => void;
  }
}

let loadPromise: Promise<typeof window.google> | null = null;

export function loadGoogleMaps(): Promise<typeof window.google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!key) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_KEY in .env"));
  }

  loadPromise = new Promise((resolve, reject) => {
    window.__initGoogleMaps = () => resolve(window.google);
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__initGoogleMaps",
      libraries: "places,marker",
      v: "weekly",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
