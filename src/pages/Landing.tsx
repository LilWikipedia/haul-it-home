import { Link } from "react-router-dom";
import { Truck, Package, MapPin, Star, ArrowRight, Shield } from "lucide-react";
import logo from "@/assets/yeehaul-logo.png";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={logo} alt="YeeHaul" className="h-10 w-10" width={40} height={40} />
          <span className="text-xl font-bold font-['Space_Grotesk']">YeeHaul</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/login?signup=true">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Truck className="h-4 w-4" />
            Need something hauled? We've got you.
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            Your stuff,<br />
            <span className="text-primary">delivered.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
            Too big for your car? No problem. Post a haul request and a nearby truck owner 
            will pick it up and deliver it to your door. Like rideshare, but for your stuff.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/login?signup=true">
              <Button size="lg" className="text-base px-8 gap-2">
                I Need a Haul <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login?signup=true&role=hauler">
              <Button size="lg" variant="outline" className="text-base px-8 gap-2">
                <Truck className="h-4 w-4" /> Become a Hauler
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-card border-y">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Package, title: "Post Your Haul", desc: "Describe what you need moved, where it is, and where it's going. Get an instant price estimate." },
              { icon: Truck, title: "A Hauler Claims It", desc: "Nearby haulers with trucks and trailers see your request and claim the job. You get notified instantly." },
              { icon: MapPin, title: "Track in Real-Time", desc: "Watch your hauler pick up and deliver your items on a live map. Rate them when it's done." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for real life</h2>
            <div className="space-y-6">
              {[
                { icon: MapPin, title: "Live GPS Tracking", desc: "Watch your hauler in real-time from pickup to delivery" },
                { icon: Star, title: "Ratings & Reviews", desc: "Every hauler is rated so you always know who's handling your stuff" },
                { icon: Shield, title: "Secure & Reliable", desc: "In-app messaging keeps everything transparent and accountable" },
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{f.title}</h4>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted rounded-3xl p-8 aspect-square flex items-center justify-center">
            <div className="text-center">
              <Truck className="h-24 w-24 text-primary mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground text-sm">Live tracking preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto bg-primary rounded-3xl p-12 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to yeehaul?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Whether you need something moved or you've got a truck and want to earn, YeeHaul has you covered.
          </p>
          <Link to="/login?signup=true">
            <Button size="lg" variant="secondary" className="text-base px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="YeeHaul" className="h-4 w-4" width={16} height={16} />
            <span className="font-semibold text-foreground">YeeHaul</span>
          </div>
          <p>&copy; {new Date().getFullYear()} YeeHaul. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
