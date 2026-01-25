import { useState } from "react";
import { useNavigate} from "react-router-dom"; // Changed import
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  Sparkles,
  Trophy,
  BarChart3,
  ThumbsUp,
  Gamepad2,
  Star,
  FileText,
  Palette,
  Snowflake,
  Save,
  Trash2,
  GripVertical,
  Check} from "lucide-react";
import { TemplateCard } from "../components/ui/template-card";
import { ThemeSelector } from "../components/ui/theme-selector";
import { QuestionTypeSelector } from "../components/ui/question-type-selector";
import { DevicePreview } from "../components/ui/device-preview";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { cn } from "../lib/utils";

const mockTemplates = [
  {
    id: "quiz-classic",
    name: "Classic Quiz",
    description: "Multiple choice questions with points and timer",
    icon: Trophy,
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    category: "Education",
    popularity: 95,
    questionsCount: 10,
    isPopular: true,
    isNew: false,
  },
  {
    id: "poll-quick",
    name: "Quick Poll",
    description: "Gather instant opinions and feedback",
    icon: BarChart3,
    color: "bg-gradient-to-br from-blue-500 to-cyan-500",
    category: "Business",
    popularity: 88,
    questionsCount: 5,
    isPopular: true,
    isNew: false,
  },
  {
    id: "vote-decision",
    name: "Team Vote",
    description: "Make democratic decisions together",
    icon: ThumbsUp,
    color: "bg-gradient-to-br from-green-500 to-emerald-500",
    category: "Team Building",
    popularity: 75,
    questionsCount: 3,
    isPopular: false,
    isNew: true,
  },
  {
    id: "game-trivia",
    name: "Trivia Game",
    description: "Fun trivia with images and sounds",
    icon: Gamepad2,
    color: "bg-gradient-to-br from-orange-500 to-yellow-500",
    category: "Entertainment",
    popularity: 92,
    questionsCount: 15,
    isPopular: true,
    isNew: false,
  },
  {
    id: "survey-feedback",
    name: "Feedback Survey",
    description: "Collect detailed feedback with rating scales",
    icon: Star,
    color: "bg-gradient-to-br from-pink-500 to-rose-500",
    category: "HR",
    popularity: 82,
    questionsCount: 8,
    isPopular: false,
    isNew: true,
  },
  {
    id: "assessment-test",
    name: "Assessment Test",
    description: "Formal testing with time limits",
    icon: FileText,
    color: "bg-gradient-to-br from-indigo-500 to-purple-500",
    category: "Education",
    popularity: 78,
    questionsCount: 20,
    isPopular: false,
    isNew: false,
  },
  {
    id: "icebreaker",
    name: "Icebreaker",
    description: "Fun questions to break the ice",
    icon: Snowflake,
    color: "bg-gradient-to-br from-cyan-500 to-blue-500",
    category: "Team Building",
    popularity: 90,
    questionsCount: 7,
    isPopular: true,
    isNew: false,
  },
  {
    id: "custom-blank",
    name: "Blank Canvas",
    description: "Start from scratch with full control",
    icon: Palette,
    color: "bg-gradient-to-br from-gray-500 to-gray-700",
    category: "Custom",
    popularity: 65,
    questionsCount: 0,
    isPopular: false,
    isNew: false,
  },
];

export default function EnhancedCreate() {
  const navigate = useNavigate(); // Changed from useLocation hook
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [title, setTitle] = useState("Untitled Quiz");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("default");
  
  const [questions, setQuestions] = useState<any[]>([
    {
      id: "q1",
      type: "SINGLE_CHOICE",
      title: "Start by editing this question",
      points: 100,
      timeLimit: 30,
      options: [
        { id: "1", text: "First Option", isCorrect: true },
        { id: "2", text: "Second Option", isCorrect: false },
      ],
    },
  ]);

  const addQuestion = (type: string) => {
    const newQuestion = {
      id: `q${questions.length + 1}`,
      type,
      title: "New Question",
      points: 100,
      timeLimit: 30,
      options: [
        { id: "1", text: "Option 1", isCorrect: false },
        { id: "2", text: "Option 2", isCorrect: true },
      ],
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const updateQuestion = (index: number, updates: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };
  
  const handleCreate = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your context",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Success!",
      description: `${selectedTemplate || "Context"} created successfully`,
    });
    
    navigate("/dashboard"); // Changed from navigate("/dashboard")
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}> {/* Changed navigate("/") */}
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg">{step === 1 ? "Create New" : title}</h1>
            <p className="text-xs text-muted-foreground">{step === 1 ? "Select a template" : "Edit content"}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {step > 1 && (
             <Button variant="outline" className="gap-2" onClick={() => setStep(1)}>
               Templates
             </Button>
           )}
           <Button className="gap-2" onClick={handleCreate} disabled={step === 1 && !selectedTemplate}>
             <Save className="w-4 h-4" /> Save & Exit
           </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex">
        {/* Left Side - Editor */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300",
          step === 2 ? "md:w-1/2 lg:w-[60%]" : "w-full"
        )}>
          {step === 1 ? (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="mr-2 h-4 w-4" /> Start creating
                </div>
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-balance">Choose a starting point</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Select a pre-made template designed for engagement or start from scratch with a blank canvas.
                </p>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none mb-6 gap-2">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">All Templates</TabsTrigger>
                  <TabsTrigger value="education" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">Education</TabsTrigger>
                  <TabsTrigger value="business" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">Business</TabsTrigger>
                  <TabsTrigger value="fun" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">Fun & Games</TabsTrigger>
                </TabsList>
                
                {["all", "education", "business", "fun"].map(tab => (
                  <TabsContent key={tab} value={tab} className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {mockTemplates
                        .filter(t => tab === 'all' || 
                           (tab === 'education' && t.category === 'Education') ||
                           (tab === 'business' && (t.category === 'Business' || t.category === 'HR')) ||
                           (tab === 'fun' && (t.category === 'Entertainment' || t.category === 'Team Building'))
                        )
                        .map((template) => (
                          <TemplateCard
                            key={template.id}
                            {...template}
                            selected={selectedTemplate === template.id}
                            onClick={() => {
                              setSelectedTemplate(template.id);
                              if (template.id === 'custom-blank') {
                                setTitle("Untitled Context");
                                setQuestions([]);
                              } else {
                                setTitle(template.name);
                              }
                              setStep(2);
                            }}
                          />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
              {/* Context Settings */}
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-heading font-bold">Context Settings</h3>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-medium"
                        placeholder="Enter a catchy title..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this about?"
                        className="resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Label className="mb-3 block">Visual Theme</Label>
                    <ThemeSelector selectedTheme={theme} onSelect={setTheme} />
                  </div>
                </CardContent>
              </Card>

              {/* Questions Editor */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                   <h3 className="text-xl font-heading font-bold">Questions ({questions.length})</h3>
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={() => addQuestion("SINGLE_CHOICE")}>
                       <Plus className="w-4 h-4 mr-2" /> Add Question
                     </Button>
                   </div>
                 </div>

                 <div className="space-y-4">
                   {questions.map((q, idx) => (
                     <Card 
                       key={q.id} 
                       className={cn(
                         "overflow-hidden transition-all border-l-4",
                         currentQuestionIndex === idx ? "border-l-primary ring-1 ring-primary/20 shadow-md" : "border-l-transparent opacity-80 hover:opacity-100"
                       )}
                       onClick={() => setCurrentQuestionIndex(idx)}
                     >
                       <div className="p-4 flex items-start gap-3">
                         <div className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground">
                           <GripVertical className="w-5 h-5" />
                         </div>
                         <div className="flex-1 space-y-3">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Question {idx + 1}</span>
                             <div className="flex items-center gap-1">
                               <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => {
                                 e.stopPropagation();
                                 const newQ = questions.filter((_, i) => i !== idx);
                                 setQuestions(newQ);
                                 if (currentQuestionIndex >= newQ.length) setCurrentQuestionIndex(Math.max(0, newQ.length - 1));
                               }}>
                                 <Trash2 className="w-3 h-3" />
                               </Button>
                             </div>
                           </div>
                           
                           {currentQuestionIndex === idx ? (
                             <div className="space-y-4">
                               <Input 
                                 value={q.title} 
                                 onChange={(e) => updateQuestion(idx, { title: e.target.value })}
                                 className="text-lg font-medium border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0"
                                 placeholder="Type your question..."
                                 autoFocus
                               />
                               
                               <div className="grid grid-cols-2 gap-4">
                                 <div>
                                   <Label className="text-xs">Time Limit (s)</Label>
                                   <Input 
                                     type="number" 
                                     value={q.timeLimit} 
                                     onChange={(e) => updateQuestion(idx, { timeLimit: parseInt(e.target.value) })} 
                                   />
                                 </div>
                                 <div>
                                   <Label className="text-xs">Points</Label>
                                   <Input 
                                     type="number" 
                                     value={q.points} 
                                     onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) })} 
                                   />
                                 </div>
                               </div>

                               <div className="space-y-2">
                                 <Label className="text-xs">Answer Options</Label>
                                 {q.options?.map((opt: any, optIdx: number) => (
                                   <div key={opt.id} className="flex items-center gap-2">
                                     <div 
                                       className={cn(
                                         "w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors",
                                         opt.isCorrect ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground hover:border-primary"
                                       )}
                                       onClick={() => {
                                         const newOptions = [...q.options];
                                         // For single choice, uncheck others
                                         if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
                                           newOptions.forEach(o => o.isCorrect = false);
                                         }
                                         newOptions[optIdx] = { ...opt, isCorrect: !opt.isCorrect };
                                         updateQuestion(idx, { options: newOptions });
                                       }}
                                     >
                                       {opt.isCorrect && <Check className="w-3 h-3" />}
                                     </div>
                                     <Input 
                                       value={opt.text}
                                       onChange={(e) => {
                                         const newOptions = [...q.options];
                                         newOptions[optIdx] = { ...opt, text: e.target.value };
                                         updateQuestion(idx, { options: newOptions });
                                       }}
                                       className="h-9"
                                       placeholder={`Option ${optIdx + 1}`}
                                     />
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => {
                                        const newOptions = q.options.filter((_: any, i: number) => i !== optIdx);
                                        updateQuestion(idx, { options: newOptions });
                                     }}>
                                       <Trash2 className="w-3 h-3" />
                                     </Button>
                                   </div>
                                 ))}
                                 <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto font-normal" onClick={() => {
                                   const newOptions = [...q.options, { id: Date.now().toString(), text: "", isCorrect: false }];
                                   updateQuestion(idx, { options: newOptions });
                                 }}>
                                   + Add Option
                                 </Button>
                               </div>
                             </div>
                           ) : (
                             <div className="text-muted-foreground truncate">{q.title}</div>
                           )}
                         </div>
                       </div>
                     </Card>
                   ))}

                   <div className="p-4 border-2 border-dashed rounded-xl text-center bg-muted/30 hover:bg-muted/50 transition-colors">
                      <p className="text-sm text-muted-foreground mb-4">Add a new question type</p>
                      <QuestionTypeSelector onSelect={addQuestion} />
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Preview */}
        {step === 2 && (
          <div className="hidden lg:block w-[40%] bg-muted/30 border-l relative">
            <div className="absolute inset-0 bg-grid-slate-200/50 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50" />
            
            <div className="relative h-full p-8 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Live Preview
                </h3>
              </div>
              
              <div className="flex-1">
                <DevicePreview 
                  title={title} 
                  themeId={theme} 
                  questions={questions} 
                  currentQuestionIndex={currentQuestionIndex} 
                />
              </div>
              
              <div className="mt-4 p-4 bg-background/80 backdrop-blur rounded-xl border text-xs text-muted-foreground text-center">
                This is how your participants will see the experience on their devices.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}