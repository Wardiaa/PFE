import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContexts, useParticipation } from "../lib/mock-data";
import { ArrowRight, QrCode } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function Join() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const { getContextByCode } = useContexts();
  const { joinContext } = useParticipation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const context = getContextByCode(code.toUpperCase());
    
    if (!context) {
      toast({ title: "Invalid Code", description: "No session found with that code.", variant: "destructive" });
      return;
    }

    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name to join.", variant: "destructive" });
      return;
    }

    joinContext(context.id, name);
    navigate(`/session/${context.id}`);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-heading font-black tracking-tight">Join Session</h1>
          <p className="text-muted-foreground">Enter the code provided by the host</p>
        </div>

        <Card className="p-6 shadow-2xl border-2 border-primary/10">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Input 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE" 
                className="text-center text-3xl font-mono uppercase tracking-widest h-16 border-2 focus-visible:ring-primary/20"
                maxLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name" 
                className="text-center h-12 text-lg"
              />
            </div>

            <Button size="lg" className="w-full h-12 text-lg font-bold" type="submit">
              Join Now <ArrowRight className="ml-2" />
            </Button>
          </form>

          <div className="mt-6 flex justify-center">
            <Button variant="ghost" className="text-muted-foreground">
              <QrCode className="mr-2 h-4 w-4" /> Scan QR Code instead
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}