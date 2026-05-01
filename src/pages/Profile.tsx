import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Truck, User, Phone, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "", avatar_url: "" });
  const [vehicle, setVehicle] = useState({ vehicle_type: "", description: "", capacity: "" });
  const [reviews, setReviews] = useState<{ rating: number }[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: p }, { data: v }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("vehicles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("reviews").select("rating").eq("reviewee_id", user.id),
      ]);
      if (p) setProfile({ full_name: p.full_name || "", phone: p.phone || "", avatar_url: p.avatar_url || "" });
      if (v) setVehicle({ vehicle_type: v.vehicle_type || "", description: v.description || "", capacity: v.capacity || "" });
      setReviews((r as { rating: number }[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ full_name: profile.full_name, phone: profile.phone }).eq("user_id", user.id);
    toast.success("Profile updated");
    setEditing(false);
  };

  if (loading) return <AppLayout><div className="h-48 bg-muted animate-pulse rounded-xl" /></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.full_name || "User"}</h2>
                <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button className="gap-2" onClick={saveProfile}><Save className="h-4 w-4" /> Save</Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone || "No phone added"}</span>
                </div>
                <Button variant="outline" size="sm" className="gap-2 mt-3" onClick={() => setEditing(true)}>
                  <Edit2 className="h-3 w-3" /> Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {userRole === "hauler" && vehicle.vehicle_type && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Type:</span> {vehicle.vehicle_type === "truck_and_trailer" ? "Truck + Trailer" : "Truck"}</p>
              {vehicle.description && <p><span className="text-muted-foreground">Description:</span> {vehicle.description}</p>}
              {vehicle.capacity && <p><span className="text-muted-foreground">Capacity:</span> {vehicle.capacity}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Profile;
