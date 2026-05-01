import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pickup_address: "",
    dropoff_address: "",
    item_description: "",
    size_category: "medium" as "small" | "medium" | "large" | "extra_large",
    timeframe: "asap",
  });

  const priceEstimate = () => {
    const basePrices = { small: 25, medium: 45, large: 75, extra_large: 120 };
    return basePrices[form.size_category];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("haul_requests").insert({
        user_id: user.id,
        pickup_address: form.pickup_address,
        dropoff_address: form.dropoff_address,
        item_description: form.item_description,
        size_category: form.size_category as any,
        estimated_price: priceEstimate(),
        timeframe: form.timeframe,
      });
      if (error) throw error;
      toast.success("Haul request posted!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">New Haul Request</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Pickup Address</Label>
                <Input placeholder="Where should the hauler pick up?" value={form.pickup_address} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Dropoff Address</Label>
                <Input placeholder="Where should it be delivered?" value={form.dropoff_address} onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>What needs to be hauled?</Label>
                <Textarea placeholder="e.g., Sheet of plywood, couch, building materials..." value={form.item_description} onChange={(e) => setForm({ ...form, item_description: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Size Category</Label>
                <Select value={form.size_category} onValueChange={(v) => setForm({ ...form, size_category: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small — fits in truck bed easily</SelectItem>
                    <SelectItem value="medium">Medium — fills most of the bed</SelectItem>
                    <SelectItem value="large">Large — needs full bed or trailer</SelectItem>
                    <SelectItem value="extra_large">Extra Large — needs large trailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select value={form.timeframe} onValueChange={(v) => setForm({ ...form, timeframe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Price</p>
                <p className="text-2xl font-bold text-primary">${priceEstimate()}</p>
              </div>
              <p className="text-xs text-muted-foreground max-w-[150px]">Based on item size. Final price may vary.</p>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            {loading ? "Posting..." : "Post Haul Request"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default NewRequest;
