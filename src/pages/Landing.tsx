import { Link } from "react-router-dom";
import { Truck, Package, MapPin, Star, ArrowRight, Shield, CheckCircle } from "lucide-react";
import logo from "@/assets/yeehaul-logo.png";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={logo} alt="YeeHaul" className="h-10 w-10" width={40} height={40} />
          <span className="text-xl font-bold font-['Space_Grotesk'] text-gradient-orange">YeeHaul</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-medium">Log In</Button>
          </Link>
          <Link to="/login?signup=true">
            <Button size="sm" className="bg-gradient-orange shadow-orange font-semibold px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Orange gradient background */}
        <div className="bg-gradient-orange px-6 pt-16 pb-36 relative">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-black/5 rounded-full translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-8 backdrop-blur-sm">
              <span>🚛</span>
              <span>The hauling marketplace for real life</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-white mb-6 max-w-3xl">
              Too big for<br />your car?<br />
              <span className="text-white/80">We've got you.</span>
            </h1>

            <p className="text-white/90 text-lg max-w-xl mb-10 leading-relaxed">
              Post a haul request and a nearby truck owner picks it up and delivers it.
              Like rideshare — but for your stuff.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/login?signup=true">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-base px-8 gap-2 shadow-lg">
                  I Need a Haul <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login?signup=true&role=hauler">
                <Button size="lg" variant="outline" className="border-2 border-white/60 text-white hover:bg-white/10 font-semibold text-base px-8 gap-2 backdrop-blur-sm">
                  <Truck className="h-4 w-4" /> Earn as a Hauler
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 mt-10">
              {[
                "Free to post",
                "Real-time tracking",
                "Rated haulers",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-white/70" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave cutout into next section */}
        <div className="relative h-16 bg-background">
          <svg className="absolute -top-px left-0 w-full" viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none">
            <path d="M0,0 C360,64 1080,64 1440,0 L1440,64 L0,64 Z" fill="hsl(34 35% 97%)" />
          </svg>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Simple as 1-2-3</p>
          <h2 className="text-3xl md:text-4xl font-bold">How YeeHaul works</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              icon: Package,
              title: "Post Your Haul",
              desc: "Describe what needs moving, where it is, and where it's going. Get an instant price estimate.",
              color: "from-orange-500 to-amber-400",
            },
            {
              step: "2",
              icon: Truck,
              title: "A Hauler Claims It",
              desc: "Nearby truck owners see your request and claim the job. You get notified and pay to confirm.",
              color: "from-orange-400 to-orange-500",
            },
            {
              step: "3",
              icon: MapPin,
              title: "Track in Real Time",
              desc: "Watch your hauler on a live map from pickup to delivery. Rate them when it's done.",
              color: "from-amber-400 to-orange-400",
            },
          ].map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line between steps on desktop */}
              {i < 2 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%-1rem)] w-8 h-0.5 bg-gradient-to-r from-orange-300 to-orange-200 z-10" />
              )}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-warm hover:shadow-orange transition-shadow duration-300 h-full">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-orange`}>
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-1">Step {step.step}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── For haulers ───────────────────────────────────────────────────── */}
      <section className="mx-6 my-8 max-w-7xl md:mx-auto rounded-3xl overflow-hidden">
        <div className="bg-foreground px-8 py-12 md:p-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-4">
                <Truck className="h-3.5 w-3.5" /> For Haulers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Got a truck?<br />Start earning.
              </h2>
              <p className="text-white/60 mb-6 leading-relaxed">
                Turn your truck or trailer into income. Browse nearby haul requests,
                claim jobs that work for you, and get paid. No boss, no schedule — just you and the road.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Set your own hours — claim only what you want",
                  "Keep 82% of every job",
                  "Get paid after every delivery",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                    <div className="h-5 w-5 rounded-full bg-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login?signup=true&role=hauler">
                <Button size="lg" className="bg-gradient-orange shadow-orange font-bold gap-2">
                  Start Hauling <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full bg-primary/20 flex items-center justify-center">
                    <Truck className="h-16 w-16 text-primary" />
                  </div>
                </div>
                {/* Floating stat chips */}
                <div className="absolute -top-4 -right-6 bg-white rounded-2xl px-4 py-2 shadow-warm text-center">
                  <p className="text-xs text-muted-foreground">You keep</p>
                  <p className="text-xl font-extrabold text-gradient-orange">82%</p>
                </div>
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl px-4 py-2 shadow-warm text-center">
                  <p className="text-xs text-muted-foreground">Your schedule</p>
                  <p className="text-sm font-bold text-foreground">100% flexible</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Built for real life</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Every feature exists because someone needed it.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: MapPin,   title: "Live GPS Tracking",   desc: "Watch your hauler in real-time from pickup to delivery. No more wondering where your stuff is." },
            { icon: Star,     title: "Verified Ratings",    desc: "Every hauler is rated by real customers, so you always know who's handling your things." },
            { icon: Shield,   title: "Secure Payments",     desc: "Pay only when a hauler claims your job. Powered by Stripe — your card info is never stored by us." },
            { icon: Package,  title: "Any Size, Any Job",   desc: "Plywood, furniture, appliances, building materials — if it fits in a truck, we can haul it." },
            { icon: Truck,    title: "Local Haulers",       desc: "Real people in your community with trucks and trailers. Fast, personal, and nearby." },
            { icon: CheckCircle, title: "Instant Quotes",  desc: "Get a price estimate based on distance and size before you post. No surprises." },
          ].map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-warm group hover:border-primary/30 hover:shadow-orange transition-all duration-200">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold mb-1">{f.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-orange rounded-3xl p-10 md:p-14 text-center shadow-orange relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-4xl mb-4">🚛</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Ready to yeehaul?</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Whether you need something moved or you've got a truck and want to earn — it starts here.
            </p>
            <Link to="/login?signup=true">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-base px-10 shadow-lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="YeeHaul" className="h-5 w-5" width={20} height={20} />
            <span className="font-semibold text-foreground">YeeHaul</span>
          </div>
          <p>&copy; {new Date().getFullYear()} YeeHaul. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
