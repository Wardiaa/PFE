import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, BarChart3, Users, MessageSquare, Sparkles, TrendingUp, Globe } from "lucide-react";
import { AnimatedBackground } from "../components/animated-background";
import { Floating3DShape } from "../components/floating-3d-shape";
import { TiltCard } from "../components/tilt-card";
import { LivePreviewMockup } from "../components/live-preview-mockup";
import { useScrollParallax } from "../hooks/use-scroll-parallax";
import { useEffect, useRef, useState } from "react";

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(end * easeOut));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasStarted]);

  return { count, ref };
}

// Stat Card Component
function StatCard({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold gradient-text tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function Home() {
  const heroParallax = useScrollParallax<HTMLDivElement>({ speed: 0.3 });
  const featuresParallax = useScrollParallax<HTMLDivElement>({ speed: 0.15 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex flex-col gap-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatedBackground />
          <Floating3DShape />
          
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Hero Content */}
        <div 
          ref={heroParallax.ref}
          className={`relative z-10 flex flex-col items-center text-center gap-8 max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-primary/20 text-primary shadow-lg shadow-primary/10 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>New: Interactive Games & AI Features</span>
          </div>

          {/* Headline */}
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-balance leading-[1.1] animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Engage your
            <br />
            <span className="gradient-text-animated">audience live</span>
          </h1>

          {/* Subtitle */}
          <p 
            className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl leading-relaxed animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            The all-in-one platform for live quizzes, polls, Q&A, and interactive presentations. 
            Create engaging experiences in seconds—no coding required.
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Link to="/auth">
              <Button 
                size="lg" 
                className="h-14 px-10 text-base rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-primary/90"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/join">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 px-10 text-base rounded-full border-2 hover:bg-secondary/50 hover:scale-105 transition-all duration-300"
              >
                Join a Session
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div 
            className="flex items-center gap-6 mt-8 text-sm text-muted-foreground animate-slide-up"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['bg-violet-500', 'bg-pink-500', 'bg-blue-500', 'bg-green-500'].map((color, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-background flex items-center justify-center text-white text-xs font-bold`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span>Trusted by 10,000+ hosts</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Sparkles key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <span>4.9/5 rating</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-3xl bg-card/50 border backdrop-blur-sm">
            <StatCard value={10000} label="Active Hosts" suffix="+" />
            <StatCard value={5000000} label="Sessions" suffix="+" />
            <StatCard value={99} label="Uptime" suffix="%" />
            <StatCard value={50} label="Countries" suffix="+" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4" ref={featuresParallax.ref}>
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary mb-4">
              <Zap className="w-4 h-4" />
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to
              <span className="gradient-text"> engage</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From quick polls to full-scale quizzes, our platform handles it all with real-time synchronization.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <TiltCard className="h-full">
              <div className="h-full p-8 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3">Instant Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get real-time results as participants vote or answer questions. No delays, just live engagement that keeps everyone connected.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-primary font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Live updates in milliseconds</span>
                </div>
              </div>
            </TiltCard>

            <TiltCard className="h-full" glowColor="rgba(59, 130, 246, 0.15)">
              <div className="h-full p-8 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3">Deep Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Understand your audience with detailed reports, exports, and engagement metrics. Make data-driven decisions.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-primary font-medium">
                  <BarChart3 className="w-4 h-4" />
                  <span>Export to Excel, PDF, CSV</span>
                </div>
              </div>
            </TiltCard>

            <TiltCard className="h-full" glowColor="rgba(168, 85, 247, 0.15)">
              <div className="h-full p-8 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3">Unlimited Scale</h3>
                <p className="text-muted-foreground leading-relaxed">
                  From small team meetings to massive conferences with thousands of participants. Our infrastructure scales automatically.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-primary font-medium">
                  <Globe className="w-4 h-4" />
                  <span>Global CDN coverage</span>
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <TiltCard className="h-full" glowColor="rgba(236, 72, 153, 0.15)">
              <div className="h-full p-8 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-6">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-3">Live Q&A & Chat</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Enable real-time questions and discussions. Moderate with ease and highlight the best questions for everyone to see.
                    </p>
                  </div>
                </div>
              </div>
            </TiltCard>

            <TiltCard className="h-full" glowColor="rgba(16, 185, 129, 0.15)">
              <div className="h-full p-8 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-6">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-3">AI-Powered Insights</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Get automatic summaries of participant responses and sentiment analysis to understand your audience better.
                    </p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                See It In Action
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Experience real-time
                <span className="gradient-text"> interaction</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Watch as votes come in live, see chat messages appear instantly, and feel the energy of true real-time engagement. Your participants will love it.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Zap, text: 'Sub-100ms latency worldwide' },
                  { icon: Users, text: 'Supports unlimited participants' },
                  { icon: BarChart3, text: 'Real-time visualization' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>

              <Link to="/auth" className="inline-block mt-8">
                <Button className="rounded-full px-8 h-12">
                  Start Creating Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Right Content - Live Mockup */}
            <div className="relative">
              <LivePreviewMockup />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get started in
              <span className="gradient-text"> 3 easy steps</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              From idea to live session in under 60 seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create',
                description: 'Set up your quiz, poll, or Q&A session with our intuitive builder. No coding needed.',
                icon: Sparkles,
                color: 'from-violet-500 to-purple-600',
              },
              {
                step: '02',
                title: 'Share',
                description: 'Send your unique session code or QR code to participants. They join instantly.',
                icon: Users,
                color: 'from-blue-500 to-cyan-500',
              },
              {
                step: '03',
                title: 'Engage',
                description: 'Watch responses flow in real-time. Present results and keep your audience hooked.',
                icon: Zap,
                color: 'from-pink-500 to-rose-500',
              },
            ].map(({ step, title, description, icon: Icon, color }, i) => (
              <div key={i} className="relative">
                {/* Connector Line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${color} shadow-xl mb-6`}>
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-6xl font-black text-muted/20 mb-2">{step}</div>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-12 md:p-16 text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to engage your audience?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of hosts creating memorable interactive experiences. Start for free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="h-14 px-10 text-base rounded-full shadow-xl hover:scale-105 transition-transform"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/join">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 text-base rounded-full border-2 border-white/30 text-white hover:bg-white/10 hover:scale-105 transition-all"
                  >
                    Join a Session
                  </Button>
                </Link>
              </div>
              <p className="text-white/60 text-sm mt-6">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}