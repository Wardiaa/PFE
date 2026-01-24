import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Zap, BarChart3, Users } from "lucide-react";
import { useAuth } from "../lib/mock-data";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-6 pt-10 md:pt-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
          New: Interactive Games Support
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight text-balance">
          Engage your audience with <span className="gradient-text">real-time interaction</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl">
          The all-in-one platform for live quizzes, polls, Q&A, and interactive presentations. No coding required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              {user ? "Go to Dashboard" : "Get Started for Free"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/join">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full">
              Join a Session
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8 mt-10">
        <FeatureCard 
          icon={<Zap className="h-6 w-6 text-yellow-500" />}
          title="Instant Feedback"
          description="Get real-time results as participants vote or answer questions. No delays, just live engagement."
        />
        <FeatureCard 
          icon={<BarChart3 className="h-6 w-6 text-blue-500" />}
          title="Deep Analytics"
          description="Understand your audience with detailed reports, exports, and engagement metrics."
        />
        <FeatureCard 
          icon={<Users className="h-6 w-6 text-purple-500" />}
          title="Unlimited Participants"
          description="Scale from a small team meeting to a massive conference audience without a hitch."
        />
      </section>

      {/* Preview Section */}
      <section className="rounded-xl overflow-hidden border shadow-2xl mt-10 bg-muted/30 p-1">
        <div className="rounded-lg bg-background border overflow-hidden aspect-video md:aspect-[21/9] flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 opacity-50" />
          <div className="z-10 text-center p-8">
            <h3 className="text-2xl font-heading font-bold mb-4">Ready to create?</h3>
            <div className="flex justify-center gap-4">
               <div className="h-32 w-24 bg-background rounded-lg shadow-lg border flex flex-col items-center justify-center p-2 card-hover">
                 <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mb-2">?</div>
                 <span className="text-xs font-bold">Quiz</span>
               </div>
               <div className="h-32 w-24 bg-background rounded-lg shadow-lg border flex flex-col items-center justify-center p-2 card-hover delay-75">
                 <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">📊</div>
                 <span className="text-xs font-bold">Poll</span>
               </div>
               <div className="h-32 w-24 bg-background rounded-lg shadow-lg border flex flex-col items-center justify-center p-2 card-hover delay-150">
                 <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mb-2">⭐</div>
                 <span className="text-xs font-bold">Rate</span>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border bg-card/50 hover:bg-card transition-colors">
      <div className="h-12 w-12 rounded-lg bg-background border shadow-xs flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-heading font-bold text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}