import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Truck, User, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"role" | "profile" | "vehicle">("role");
  const [role, setRole] = useState<"user" | "hauler" | null>(null);
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState<"truck" | "truck_and_trailer">("truck");
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selected: "user" | "hauler") => {
    setRole(selected);
    setStep("profile");
  };

  const handleProfileSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Update profile phone
      await supabase.from("profiles").update({ phone }).eq("user_id", user.id);
      
      // Insert role
      const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: role! });
      if (error) throw error;

      if (role === "hauler") {
        setStep("vehicle");
      } else {
        toast.success("Welcome to HaulNow!");
        // Force a page reload to refresh auth context
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("vehicles").insert({
        user_id: user.id,
        vehicle_type: vehicleType,
        description: vehicleDesc,
        capacity,
      });
      if (error) throw error;
      toast.success("You're all set! Welcome to HaulNow!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {step === "role" && "Choose your role"}
            {step === "profile" && "Complete your profile"}
            {step === "vehicle" && "Your vehicle"}
          </CardTitle>
          <CardDescription>
            {step === "role" && "How will you use HaulNow?"}
            {step === "profile" && "Add your contact info"}
            {step === "vehicle" && "Tell us about your truck"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "role" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelect("user")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">I need a haul</div>
                  <div className="text-xs text-muted-foreground mt-1">Post requests & get deliveries</div>
                </div>
              </button>
              <button
                onClick={() => handleRoleSelect("hauler")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Truck className="h-7 w-7 text-accent" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">I'm a Hauler</div>
                  <div className="text-xs text-muted-foreground mt-1">Earn money with your truck</div>
                </div>
              </button>
            </div>
          )}

          {step === "profile" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="(555) 123-4567" className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <Button className="w-full gap-2" onClick={handleProfileSubmit} disabled={loading}>
                {loading ? "Saving..." : "Continue"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "vehicle" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["truck", "truck_and_trailer"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setVehicleType(t)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${vehicleType === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      {t === "truck" ? "🚛 Truck" : "🚛🚜 Truck + Trailer"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vehicle Description</Label>
                <Textarea placeholder="e.g., 2020 Ford F-150, 6ft bed" value={vehicleDesc} onChange={(e) => setVehicleDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input placeholder="e.g., Up to 2000 lbs, 8ft bed" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
              <Button className="w-full gap-2" onClick={handleVehicleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Start Hauling"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
