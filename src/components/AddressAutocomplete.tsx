import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadGoogleMaps } from "@/lib/google-maps";

type Suggestion = {
  placeId: string;
  text: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect: (result: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  required?: boolean;
};

const AddressAutocomplete = ({ value, onChange, onSelect, placeholder, required }: Props) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef<any>(null);
  const placesLibRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    loadGoogleMaps()
      .then(async (google) => {
        const places = await google.maps.importLibrary("places");
        if (!mounted) return;
        placesLibRef.current = places;
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      })
      .catch((e) => console.warn("Google Maps load failed:", e));
    return () => {
      mounted = false;
    };
  }, []);

  const fetchSuggestions = (input: string) => {
    if (!placesLibRef.current || !input.trim()) {
      setSuggestions([]);
      return;
    }
    placesLibRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: sessionTokenRef.current,
    })
      .then(({ suggestions: results }: any) => {
        setSuggestions(
          (results || [])
            .map((s: any) => {
              const p = s.placePrediction;
              if (!p) return null;
              return { placeId: p.placeId, text: p.text?.toString() ?? "" };
            })
            .filter(Boolean)
            .slice(0, 5)
        );
        setOpen(true);
      })
      .catch((e: any) => console.warn("Autocomplete error:", e));
  };

  const handleChange = (v: string) => {
    onChange(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(v), 200);
  };

  const handlePick = async (s: Suggestion) => {
    setOpen(false);
    setSuggestions([]);
    onChange(s.text);
    try {
      const places = placesLibRef.current;
      const place = new places.Place({ id: s.placeId });
      await place.fetchFields({ fields: ["location", "formattedAddress"] });
      const loc = place.location;
      onSelect({
        address: place.formattedAddress || s.text,
        lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
        lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
      });
      // new session after a selection
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    } catch (e) {
      console.warn("Place details failed:", e);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-popover border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(s)}
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
