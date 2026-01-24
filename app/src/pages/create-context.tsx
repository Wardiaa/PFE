import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContexts, useAuth,type  Question, type QuestionType,type ContextType } from "../lib/mock-data";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Trash2, GripVertical, Image as ImageIcon, Save, ArrowLeft } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function CreateContext() {
  const { user } = useAuth();
  const { createContext } = useContexts();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContextType>("QUIZ");
  const [questions, setQuestions] = useState<Question[]>([]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleCreate = () => {
    if (!title) {
      toast({ title: "Title required", description: "Please enter a title for your context.", variant: "destructive" });
      return;
    }

    createContext({
      title,
      description,
      type,
      creatorId: user.id,
      questions,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    toast({ title: "Success!", description: `${type} created successfully.` });
    navigate("/dashboard");
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: `q${Date.now()}`,
      type: type === 'POLL' ? 'POLL' : 'QUIZ',
      title: "New Question",
      timeLimit: 30,
      points: 100,
      options: [
        { id: '1', text: 'Option 1', isCorrect: false },
        { id: '2', text: 'Option 2', isCorrect: false }
      ]
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? navigate("/dashboard") : setStep(1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">{step === 1 ? "Create New Context" : `Edit ${type} Questions`}</h1>
          <p className="text-muted-foreground">{step === 1 ? "Choose a template and set up details" : "Add and customize your questions"}</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Team Sync" className="text-lg" />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this context about?" />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  {(['QUIZ', 'POLL', 'VOTE', 'GAME'] as ContextType[]).map((t) => (
                    <div 
                      key={t}
                      onClick={() => setType(t)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${type === t ? 'border-primary bg-primary/5' : 'border-transparent bg-muted hover:bg-muted/80'}`}
                    >
                      <div className="font-bold mb-1">{t}</div>
                      <div className="text-xs text-muted-foreground">
                        {t === 'QUIZ' && "Right/Wrong answers, points, leaderboard."}
                        {t === 'POLL' && "Collect opinions, no right answers."}
                        {t === 'VOTE' && "Democratic decision making."}
                        {t === 'GAME' && "Interactive mini-games and challenges."}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-8 border flex items-center justify-center">
              <div className="text-center space-y-4 max-w-xs">
                <div className="h-32 w-32 bg-background rounded-full mx-auto flex items-center justify-center shadow-lg text-4xl">
                  {type === 'QUIZ' ? '🏆' : type === 'POLL' ? '📊' : type === 'VOTE' ? '✋' : '🎮'}
                </div>
                <h3 className="font-bold text-xl">{type} Mode</h3>
                <p className="text-sm text-muted-foreground">
                  {type === 'QUIZ' && "Perfect for testing knowledge and engaging competition."}
                  {type === 'POLL' && "Great for feedback, surveys, and pulse checks."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={() => setStep(2)}>
              Next: Add Questions <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionEditor 
                key={q.id} 
                index={idx} 
                question={q} 
                onUpdate={(updates) => updateQuestion(q.id, updates)}
                onDelete={() => removeQuestion(q.id)}
              />
            ))}
            
            <Button variant="outline" className="w-full py-8 border-dashed" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>

          <div className="flex justify-between pt-8 border-t">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button size="lg" onClick={handleCreate}>
              <Save className="mr-2 h-4 w-4" /> Create {type}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ index, question, onUpdate, onDelete }: { index: number, question: Question, onUpdate: (u: Partial<Question>) => void, onDelete: () => void }) {
  return (
    <Card className="relative group overflow-hidden border-l-4 border-l-primary">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="destructive" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <GripVertical className="h-4 w-4 cursor-move" />
          Question {index + 1}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Input 
            value={question.title} 
            onChange={e => onUpdate({ title: e.target.value })} 
            className="font-medium text-lg border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0" 
            placeholder="Type your question here..."
          />
          <Select value={question.type} onValueChange={(v: QuestionType) => onUpdate({ type: v })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="QUIZ">Multiple Choice</SelectItem>
              <SelectItem value="OPEN">Open Text</SelectItem>
              <SelectItem value="POLL">Poll/Vote</SelectItem>
              <SelectItem value="RATING">Rating Scale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question Settings */}
        <div className="flex gap-4 text-sm">
           <div className="flex items-center gap-2">
             <Label>Points</Label>
             <Input type="number" className="w-20 h-8" value={question.points} onChange={e => onUpdate({ points: parseInt(e.target.value) })} />
           </div>
           <div className="flex items-center gap-2">
             <Label>Seconds</Label>
             <Input type="number" className="w-20 h-8" value={question.timeLimit} onChange={e => onUpdate({ timeLimit: parseInt(e.target.value) })} />
           </div>
           <Button variant="ghost" size="sm" className="ml-auto">
             <ImageIcon className="mr-2 h-4 w-4" /> Add Media
           </Button>
        </div>

        {/* Options Editor */}
        {(question.type === 'QUIZ' || question.type === 'MULTIPLE_CHOICE' || question.type === 'POLL') && (
          <div className="space-y-2 pl-4 border-l-2">
            {question.options?.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <div 
                  className={`h-4 w-4 rounded-full border cursor-pointer ${opt.isCorrect ? 'bg-green-500 border-green-500' : 'bg-transparent'}`}
                  onClick={() => {
                     // Toggle correct answer logic
                     const newOptions = question.options?.map(o => ({ ...o, isCorrect: o.id === opt.id }));
                     onUpdate({ options: newOptions });
                  }}
                />
                <Input 
                  value={opt.text} 
                  onChange={(e) => {
                    const newOptions = [...(question.options || [])];
                    newOptions[i] = { ...opt, text: e.target.value };
                    onUpdate({ options: newOptions });
                  }}
                  className="h-9"
                  placeholder={`Option ${i + 1}`}
                />
              </div>
            ))}
             <Button variant="link" size="sm" className="px-0" onClick={() => {
               const newId = (question.options?.length || 0) + 1;
               onUpdate({ options: [...(question.options || []), { id: `${newId}`, text: '', isCorrect: false }] });
             }}>
               + Add Option
             </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}