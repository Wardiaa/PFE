// src/pages/results.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useToast } from "../hooks/use-toast";

interface QuestionResult {
  id: string;
  title: string;
  type: string;
  responses: any[];
  correctRate?: number;
  averageScore?: number;
}

interface SessionResult {
  id: string;
  title: string;
  code: string;
  contextId: string;
  status: string;
  participantCount: number;
  totalResponses: number;
  averageScore: number;
  completionRate: number;
  startedAt: string;
  endedAt: string;
  questions: QuestionResult[];
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec489a', '#14b8a6', '#f97316'];

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


useEffect(() => {
  const fetchResults = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch session data
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          code,
          status,
          participant_count,
          started_at,
          ended_at,
          context_id,
          contexts (
            id,
            title,
            questions (
              id,
              title,
              type,
              points,
              question_order
            )
          )
        `)
        .eq('id', id)
        .single();
        
      if (sessionError) throw sessionError;
      
      const sessionData = session as any;
      const contextData = sessionData.contexts;
      const questionsArray = contextData?.questions || [];
      
      // Fetch all responses for this session
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select(`
          id,
          question_id,
          answer,
          is_correct,
          points_earned,
          submitted_at
        `)
        .eq('session_id', id);
        
      if (responsesError) throw responsesError;
      
      // Fetch participants count
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id')
        .eq('session_id', id);
        
      if (participantsError) throw participantsError;
      
      // Process results by question
      const questions = questionsArray.sort((a: any, b: any) => a.question_order - b.question_order);
      
      const questionResults: QuestionResult[] = questions.map((q: any) => {
        const questionResponses = (responses || []).filter((r: any) => r.question_id === q.id);
        const totalResponses = questionResponses.length;
        
        // Calculate correct rate for multiple choice
        const correctCount = questionResponses.filter((r: any) => r.is_correct === true).length;
        const correctRate = totalResponses > 0 ? (correctCount / totalResponses) * 100 : 0;
        
        // Calculate average score
        const totalPoints = questionResponses.reduce((sum: number, r: any) => sum + (r.points_earned || 0), 0);
        const averageScore = totalResponses > 0 ? totalPoints / totalResponses : 0;
        
        return {
          id: q.id,
          title: q.title,
          type: q.type,
          responses: questionResponses,
          correctRate,
          averageScore,
        };
      });
      
      // Calculate overall stats
      const totalResponses = (responses || []).length;
      const totalPossiblePoints = questions.reduce((sum: number, q: any) => sum + (q.points || 10), 0);
      const totalEarnedPoints = (responses || []).reduce((sum: number, r: any) => sum + (r.points_earned || 0), 0);
      const averageScore = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;
      
      // Completion rate: participants who answered all questions
      const questionsCount = questions.length;
      // Simplified completion rate calculation
      const completionRate = participants && participants.length > 0 && totalResponses > 0
        ? Math.min(100, (totalResponses / (participants.length * questionsCount)) * 100)
        : 0;
      
      setResults({
        id: sessionData.id,
        title: contextData?.title || 'Untitled',
        code: sessionData.code,
        contextId: sessionData.context_id,
        status: sessionData.status,
        participantCount: participants?.length || 0,
        totalResponses,
        averageScore,
        completionRate,
        startedAt: sessionData.started_at,
        endedAt: sessionData.ended_at,
        questions: questionResults,
      });
      
    } catch (err: any) {
      console.error('Failed to fetch results:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message || 'Failed to load results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  fetchResults();
}, [id, toast]);

  const handleExportCSV = () => {
    if (!results) return;
    
    // Create CSV data
    const headers = ['Question', 'Type', 'Responses', 'Correct Rate (%)', 'Average Score'];
    const rows = results.questions.map(q => [
      q.title,
      q.type,
      q.responses.length,
      q.correctRate?.toFixed(1) || 'N/A',
      q.averageScore?.toFixed(1) || 'N/A',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${results.title}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exported',
      description: 'Results exported as CSV',
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link Copied',
      description: 'Share this link to view results',
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <ArrowLeft className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Results Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'No results available for this session'}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = results.questions.map((q, i) => ({
    name: `Q${i + 1}`,
    participants: q.responses.length,
    correctRate: q.correctRate || 0,
  }));

  // Prepare pie data for question types
  const typeCounts = results.questions.reduce((acc: Record<string, number>, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Results: {results.title}</h1>
            <p className="text-sm text-muted-foreground">
              Session Code: {results.code} • {new Date(results.startedAt || results.endedAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{results.participantCount}</div>
            <p className="text-xs text-muted-foreground mt-1">joined this session</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{results.totalResponses}</div>
            <p className="text-xs text-muted-foreground mt-1">total responses collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{results.averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">across all questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{results.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">answered all questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="p-4 md:p-6">
          <CardTitle className="mb-4 md:mb-6 text-base md:text-lg">Response Rate per Question</CardTitle>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="participants" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <CardTitle className="mb-4 md:mb-6 text-base md:text-lg">Correct Rate per Question</CardTitle>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="correctRate" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>


      {pieData.length > 0 && (
        <Card className="p-4 md:p-6 lg:col-span-2">
          <CardTitle className="mb-4 md:mb-6 text-base md:text-lg">Question Type Distribution</CardTitle>
          <div className="h-64 md:h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentage = percent !== undefined ? (percent * 100).toFixed(0) : '0';
                    return `${name} (${percentage}%)`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      </div>

      {/* Question Details */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Question Details</h2>
        <div className="space-y-4">
          {results.questions.map((question, idx) => (
            <Card key={question.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 p-4 md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{question.type}</span>
                    </div>
                    <CardTitle className="text-base md:text-lg">{question.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{question.responses.length} responses</div>
                    {question.correctRate !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Correct: {question.correctRate.toFixed(1)}%
                      </div>
                    )}
                    {question.averageScore !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Avg Score: {question.averageScore.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  {question.responses.length} participant{question.responses.length !== 1 ? 's' : ''} responded
                </p>
                {/* Show sample responses for open text */}
                {question.type === 'OPEN_TEXT' && question.responses.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Responses:</p>
                    {question.responses.slice(-5).reverse().map((r, i) => (
                      <div key={i} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-sm">{r.answer?.text || JSON.stringify(r.answer)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Show distribution for multiple choice */}
                {question.type === 'MULTIPLE_CHOICE' && question.responses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Response Distribution:</p>
                    {Object.entries(
                      question.responses.reduce((acc: Record<string, number>, r) => {
                        const optId = r.answer?.optionId || JSON.stringify(r.answer);
                        acc[optId] = (acc[optId] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([optId, count]) => (
                      <div key={optId} className="flex items-center gap-2">
                        <div className="text-xs w-20 truncate">{optId}</div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / question.responses.length) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium w-10">{count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}