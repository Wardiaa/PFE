import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useContexts,type Context } from "../lib/mock-data";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const { getContext } = useContexts();
  const [context, setContext] = useState<Context | null>(null);

  useEffect(() => {
    if (id) {
      const ctx = getContext(id);
      setContext(ctx || null);
    }
  }, [id]);

  if (!context) return <div className="p-10 text-center">Loading...</div>;

  // Mock data for charts

  const engagementData = [
    { name: "Q1", participants: 12 },
    { name: "Q2", participants: 11 },
    { name: "Q3", participants: 12 },
    { name: "Q4", participants: 10 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold">Results: {context.title}</h1>
            <p className="text-muted-foreground">{new Date().toLocaleDateString()} • {context.participantsCount} Participants</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">78%</div>
            <p className="text-xs text-green-500 font-bold mt-1">+12% vs last session</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground mt-1">11/12 completed all questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">4.8<span className="text-xl text-muted-foreground">/5</span></div>
            <p className="text-xs text-muted-foreground mt-1">Based on feedback poll</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <CardTitle className="mb-6">Performance per Question</CardTitle>
          <div className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="participants" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-6">Leaderboard Top 5</CardTitle>
          <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((pos) => (
               <div key={pos} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                 <div className="flex items-center gap-4">
                   <div className={`
                     h-8 w-8 rounded-full flex items-center justify-center font-bold
                     ${pos === 1 ? 'bg-yellow-100 text-yellow-700' : ''}
                     ${pos === 2 ? 'bg-gray-100 text-gray-700' : ''}
                     ${pos === 3 ? 'bg-orange-100 text-orange-700' : ''}
                     ${pos > 3 ? 'bg-white border' : ''}
                   `}>
                     {pos}
                   </div>
                   <span className="font-medium">Participant {pos}</span>
                 </div>
                 <div className="font-mono font-bold">{1000 - (pos * 50)} pts</div>
               </div>
             ))}
          </div>
        </Card>
      </div>
    </div>
  );
}