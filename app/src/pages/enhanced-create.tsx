// pages/enhanced-create.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Eye, 
  Copy, 
  QrCode,
  Lock,
  Globe,
  Users,
  Music,
  Bell,
  Download,
  Save,
  Sparkles,
  Trophy,
  BarChart3,
  ThumbsUp,
  Gamepad2,
  Star,
  FileText,
 
  Snowflake,
  Palette,
  Volume2,
  VolumeX,
  Shuffle,
  List,
  CheckCircle2,
  Calendar,
  TestTube,
  UserCheck,
  Shield
} from "lucide-react";
import { TemplateCard } from "../components/ui/template-card";
import { ThemeSelector } from "../components/ui/theme-selector";
import { QuestionTypeSelector } from "../components/ui/question-type-selector";
import { useToast } from "../hooks/use-toast";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("default");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  const [settings, setSettings] = useState({
    participationMode: "PUBLIC",
    requireAccount: false,
    allowGuest: true,
    allowAnonymous: false,
    maxParticipants: 100,
    timeLimit: 60,
    shuffleQuestions: false,
    showLeaderboard: true,
    showProgress: true,
    allowRetry: false,
    answerValidation: "AUTO",
    soundEffects: true,
    backgroundMusic: "",
    notifications: true,
  });
  
  const [questions, setQuestions] = useState<any[]>([
    {
      id: "q1",
      type: "SINGLE_CHOICE",
      title: "Sample question?",
      points: 100,
      timeLimit: 30,
      options: [
        { id: "1", text: "Option 1", isCorrect: false },
        { id: "2", text: "Option 2", isCorrect: true },
        { id: "3", text: "Option 3", isCorrect: false },
      ],
    },
  ]);
  
  const addQuestion = () => {
    const newQuestion = {
      id: `q${questions.length + 1}`,
      type: "SINGLE_CHOICE",
      title: "New question",
      points: 100,
      timeLimit: 30,
      options: [
        { id: "1", text: "Option 1", isCorrect: false },
        { id: "2", text: "Option 2", isCorrect: true },
      ],
    };
    setQuestions([...questions, newQuestion]);
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
      description: `${selectedTemplate || "Custom"} created successfully`,
    });
    
    navigate("/dashboard");
  };
  
  const renderStep1 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 1 of 5
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-bold">Choose a Template</h2>
        <p className="text-sm md:text-base text-muted-foreground px-4">Start with a pre-made template or create from scratch</p>
      </div>
      
      <Tabs defaultValue="popular" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="popular" className="text-xs md:text-sm">Popular</TabsTrigger>
          <TabsTrigger value="education" className="text-xs md:text-sm">Education</TabsTrigger>
          <TabsTrigger value="business" className="text-xs md:text-sm">Business</TabsTrigger>
          <TabsTrigger value="games" className="text-xs md:text-sm">Games</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular" className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {mockTemplates
              .filter(t => t.isPopular)
              .map((template) => (
                <TemplateCard
                  key={template.id}
                  {...template}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setStep(2);
                    toast({
                      title: `Template selected: ${template.name}`,
                      description: "Let's customize it!",
                    });
                  }}
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {mockTemplates
              .filter(t => t.category === "Education")
              .map((template) => (
                <TemplateCard
                  key={template.id}
                  {...template}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setStep(2);
                  }}
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="business" className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {mockTemplates
              .filter(t => ["Business", "HR"].includes(t.category))
              .map((template) => (
                <TemplateCard
                  key={template.id}
                  {...template}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setStep(2);
                  }}
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="games" className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {mockTemplates
              .filter(t => ["Entertainment", "Team Building"].includes(t.category))
              .map((template) => (
                <TemplateCard
                  key={template.id}
                  {...template}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setStep(2);
                  }}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="pt-6 md:pt-8 border-t">
        <Button
          variant="outline"
          className="w-full py-6 md:py-8 border-dashed flex-col md:flex-row h-auto"
          onClick={() => {
            setSelectedTemplate("custom");
            setStep(2);
          }}
        >
          <Plus className="h-5 w-5 mb-2 md:mb-0 md:mr-2" />
          <div className="text-center md:text-left">
            <div className="font-bold">Start from Scratch</div>
            <div className="text-sm text-muted-foreground">Full customization, no templates</div>
          </div>
        </Button>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 2 of 5
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-bold">Customize Details</h2>
        <p className="text-sm md:text-base text-muted-foreground px-4">Set up the basic information and appearance</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Team Knowledge Challenge"
              className="text-base md:text-lg h-11 md:h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this context is about..."
              className="min-h-24 md:min-h-30"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="team-building">Team Building</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {["Quiz", "Team", "Fun", "Learning", "Challenge"].map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setTags(
                      tags.includes(tag)
                        ? tags.filter((t) => t !== tag)
                        : [...tags, tag]
                    );
                  }}
                >
                  {tag}
                </Badge>
              ))}
              <Input
                placeholder="Add custom tag..."
                className="w-full sm:w-32 h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    setTags([...tags, e.currentTarget.value]);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4 md:space-y-6">
          <ThemeSelector value={theme} onChange={setTheme} />
          
          <div className="space-y-4">
            <h3 className="font-medium">Cover Image</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600",
                "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=600",
                "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600",
              ].map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 hover:border-primary transition-all group"
                >
                  <img
                    src={url}
                    alt={`Cover ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary">
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full">
              Upload Custom Image
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(3)} className="w-full sm:w-auto">
          Next: Questions <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 3 of 5
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-bold">Design Questions</h2>
        <p className="text-sm md:text-base text-muted-foreground px-4">Add and customize your questions</p>
      </div>
      
      <div className="space-y-4 md:space-y-6">
        {questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            index={index}
            question={question}
            onUpdate={(updates) => {
              const newQuestions = [...questions];
              newQuestions[index] = { ...question, ...updates };
              setQuestions(newQuestions);
            }}
            onDelete={() => {
              setQuestions(questions.filter((_, i) => i !== index));
            }}
          />
        ))}
      </div>
      
      <Button
        variant="outline"
        className="w-full py-6 md:py-8 border-dashed flex-col md:flex-row h-auto"
        onClick={addQuestion}
      >
        <Plus className="h-5 w-5 mb-2 md:mb-0 md:mr-2" />
        <div className="text-center md:text-left">
          <div className="font-bold">Add New Question</div>
          <div className="text-sm text-muted-foreground">Choose from various question types</div>
        </div>
      </Button>
      
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(4)} className="w-full sm:w-auto">
          Next: Settings <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
  
  const renderStep4 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 4 of 5
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-bold">Configure Settings</h2>
        <p className="text-sm md:text-base text-muted-foreground px-4">Fine-tune participation rules and experience</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5" /> Participation
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <Label>Participation Mode</Label>
                <p className="text-sm text-muted-foreground">Who can join?</p>
              </div>
              <Select
                value={settings.participationMode}
                onValueChange={(value) =>
                  setSettings({ ...settings, participationMode: value })
                }
              >
                <SelectTrigger className="w-full sm:w-45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <Globe className="mr-2 h-4 w-4 inline" /> Public
                  </SelectItem>
                  <SelectItem value="INVITE_ONLY">
                    <Lock className="mr-2 h-4 w-4 inline" /> Invite Only
                  </SelectItem>
                  <SelectItem value="CODE_REQUIRED">
                    <Copy className="mr-2 h-4 w-4 inline" /> Code Required
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Require Account</Label>
                  <p className="text-sm text-muted-foreground">Users must sign in</p>
                </div>
                <Switch
                  checked={settings.requireAccount}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireAccount: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Guest Participation</Label>
                  <p className="text-sm text-muted-foreground">Guests can join without account</p>
                </div>
                <Switch
                  checked={settings.allowGuest}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowGuest: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Anonymous</Label>
                  <p className="text-sm text-muted-foreground">Hide participant names</p>
                </div>
                <Switch
                  checked={settings.allowAnonymous}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowAnonymous: checked })
                  }
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Participants: {settings.maxParticipants}</Label>
              </div>
              <Slider
                value={[settings.maxParticipants]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, maxParticipants: value })
                }
                min={1}
                max={1000}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" /> Game Rules
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <Label>Time Limit (minutes)</Label>
                <p className="text-sm text-muted-foreground">Overall time limit</p>
              </div>
              <Input
                type="number"
                value={settings.timeLimit}
                onChange={(e) =>
                  setSettings({ ...settings, timeLimit: parseInt(e.target.value) })
                }
                className="w-full sm:w-24"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Answer Validation</Label>
              </div>
              <Select
                value={settings.answerValidation}
                onValueChange={(value) =>
                  setSettings({ ...settings, answerValidation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Automatic</SelectItem>
                  <SelectItem value="MANUAL">Manual Review</SelectItem>
                  <SelectItem value="REAL_TIME">Real-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Show Leaderboard</Label>
                  <p className="text-sm text-muted-foreground">Display scores during game</p>
                </div>
                <Switch
                  checked={settings.showLeaderboard}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showLeaderboard: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Show Progress</Label>
                  <p className="text-sm text-muted-foreground">Show question progress</p>
                </div>
                <Switch
                  checked={settings.showProgress}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showProgress: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Retry</Label>
                  <p className="text-sm text-muted-foreground">Participants can try again</p>
                </div>
                <Switch
                  checked={settings.allowRetry}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowRetry: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Shuffle Questions</Label>
                  <p className="text-sm text-muted-foreground">Randomize question order</p>
                </div>
                <Switch
                  checked={settings.shuffleQuestions}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, shuffleQuestions: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Music className="h-5 w-5" /> Audio & Effects
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label>Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds during game</p>
              </div>
              <Switch
                checked={settings.soundEffects}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, soundEffects: checked })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Background Music</Label>
              <Select
                value={settings.backgroundMusic}
                onValueChange={(value) =>
                  setSettings({ ...settings, backgroundMusic: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select music track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upbeat">Upbeat Energy</SelectItem>
                  <SelectItem value="calm">Calm Focus</SelectItem>
                  <SelectItem value="epic">Epic Adventure</SelectItem>
                  <SelectItem value="none">No Music</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label>Send Notifications</Label>
                <p className="text-sm text-muted-foreground">Email reminders and updates</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>
            
            {settings.notifications && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Join reminders</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Results ready</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Time limit warnings</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(3)} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(5)} className="w-full sm:w-auto">
          Next: Preview <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
  
  const renderStep5 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 5 of 5
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-bold">Preview & Launch</h2>
        <p className="text-sm md:text-base text-muted-foreground px-4">Review your creation before publishing</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="overflow-hidden border-2">
            <div className="h-32 md:h-48 bg-linear-to-r from-purple-500 to-pink-500 relative">
              <div className="absolute bottom-3 md:bottom-4 left-4 md:left-6">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  <Eye className="mr-1 h-3 w-3" /> Preview Mode
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{title || "Your Context Title"}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {description || "Context description will appear here"}
                  </p>
                </div>
                <Badge variant="outline" className="text-base md:text-lg">
                  {questions.length} Qs
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold">{questions.length}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold">
                    {questions.reduce((sum, q) => sum + q.points, 0)}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">Total Points</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold">{settings.timeLimit}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold">{settings.maxParticipants}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Max Players</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-bold">Settings Summary:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {settings.participationMode === "PUBLIC" ? (
                      <><Globe className="mr-1 h-3 w-3" /> Public</>
                    ) : settings.participationMode === "INVITE_ONLY" ? (
                      <><Lock className="mr-1 h-3 w-3" /> Invite Only</>
                    ) : (
                      <><Shield className="mr-1 h-3 w-3" /> Code Required</>
                    )}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {settings.requireAccount ? (
                      <><UserCheck className="mr-1 h-3 w-3" /> Account Required</>
                    ) : (
                      <><Users className="mr-1 h-3 w-3" /> Guest Allowed</>
                    )}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {settings.showLeaderboard ? (
                      <><Trophy className="mr-1 h-3 w-3" /> Leaderboard</>
                    ) : (
                      <><BarChart3 className="mr-1 h-3 w-3" /> No Leaderboard</>
                    )}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {settings.soundEffects ? (
                      <><Volume2 className="mr-1 h-3 w-3" /> Sound On</>
                    ) : (
                      <><VolumeX className="mr-1 h-3 w-3" /> Sound Off</>
                    )}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {settings.shuffleQuestions ? (
                      <><Shuffle className="mr-1 h-3 w-3" /> Shuffled</>
                    ) : (
                      <><List className="mr-1 h-3 w-3" /> Sequential</>
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <h4 className="font-bold mb-4">Share Options</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <Button variant="outline" className="h-auto py-3 md:py-4 justify-start">
                  <QrCode className="mr-2 h-4 md:h-5 w-4 md:w-5 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-sm md:text-base">QR Code</div>
                    <div className="text-xs text-muted-foreground">Scan to join</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-3 md:py-4 justify-start">
                  <Copy className="mr-2 h-4 md:h-5 w-4 md:w-5 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-sm md:text-base">Copy Link</div>
                    <div className="text-xs text-muted-foreground">Share via URL</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-3 md:py-4 justify-start">
                  <Download className="mr-2 h-4 md:h-5 w-4 md:w-5 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-sm md:text-base">Export</div>
                    <div className="text-xs text-muted-foreground">PDF/CSV template</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardContent className="p-4 md:p-6">
              <h4 className="font-bold mb-4">Ready to Launch?</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Your context is ready! You can publish it now or save as draft.
              </p>
              
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleCreate}>
                  <Save className="mr-2 h-5 w-5" />
                  Publish & Launch
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-5 w-5" />
                  Preview Live
                </Button>
                
                <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <h4 className="font-bold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Template
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Launch
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Bell className="mr-2 h-4 w-4" />
                  Set Reminders
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Participation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(4)} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
        </Button>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
          <Button size="lg" onClick={handleCreate} className="w-full sm:w-auto">
            <Save className="mr-2 h-5 w-5" /> Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (step === 1 ? navigate("/dashboard") : setStep(step - 1))}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold">
                {step === 1 && "Choose Template"}
                {step === 2 && "Customize Details"}
                {step === 3 && "Design Questions"}
                {step === 4 && "Configure Settings"}
                {step === 5 && "Preview & Launch"}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Create an engaging interactive experience
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Eye className="mr-2 h-4 w-4" /> 
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Save className="mr-2 h-4 w-4" /> 
              <span className="hidden sm:inline">Save Draft</span>
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex flex-col items-center ${
                  s <= step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center border-2 mb-1 md:mb-2 text-sm md:text-base ${
                    s < step
                      ? "bg-primary border-primary text-primary-foreground"
                      : s === step
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : s}
                </div>
                <span className="text-xs hidden sm:block">
                  {s === 1 && "Template"}
                  {s === 2 && "Details"}
                  {s === 3 && "Questions"}
                  {s === 4 && "Settings"}
                  {s === 5 && "Launch"}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}

function QuestionEditor({
  index,
  question,
  onUpdate,
  onDelete,
}: {
  index: number;
  question: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <Card className="relative group border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-3 md:top-4 right-3 md:right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs md:text-sm"
        >
          {showAdvanced ? "Simple" : "Advanced"}
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete} className="text-xs md:text-sm">
          Delete
        </Button>
      </div>
      
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-primary/10 text-primary h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center font-bold shrink-0 text-sm md:text-base">
            Q{index + 1}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <Input
                value={question.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Enter your question here..."
                className="text-lg md:text-xl font-bold border-0 p-0 focus-visible:ring-0"
              />
              <Textarea
                placeholder="Add description (optional)"
                className="mt-2 border-0 p-0 focus-visible:ring-0 resize-none text-sm"
                rows={1}
              />
            </div>
            
            <QuestionTypeSelector
              value={question.type}
              onChange={(type) => onUpdate({ type })}
            />
            
            {/* Question Options */}
            {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") && (
              <div className="space-y-3">
                <Label>Options</Label>
                {question.options?.map((option: any, optIndex: number) => (
                  <div key={option.id} className="flex items-center gap-2 md:gap-3">
                    <div
                      className={`h-5 w-5 md:h-6 md:w-6 rounded-full border-2 cursor-pointer flex items-center justify-center shrink-0 ${
                        option.isCorrect
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border"
                      }`}
                      onClick={() => {
                        const newOptions = question.options.map((opt: any, i: number) => ({
                          ...opt,
                          isCorrect: question.type === "SINGLE_CHOICE" 
                            ? i === optIndex 
                            : opt.id === option.id ? !opt.isCorrect : opt.isCorrect,
                        }));
                        onUpdate({ options: newOptions });
                      }}
                    >
                      {option.isCorrect && <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />}
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...question.options];
                        newOptions[optIndex] = { ...option, text: e.target.value };
                        onUpdate({ options: newOptions });
                      }}
                      placeholder={`Option ${optIndex + 1}`}
                      className="flex-1 text-sm md:text-base"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = question.options.filter(
                          (_: any, i: number) => i !== optIndex
                        );
                        onUpdate({ options: newOptions });
                      }}
                      className="text-xs md:text-sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newId = `opt${question.options.length + 1}`;
                    const newOptions = [
                      ...question.options,
                      { id: newId, text: "", isCorrect: false },
                    ];
                    onUpdate({ options: newOptions });
                  }}
                  className="text-xs md:text-sm"
                >
                  <Plus className="mr-1 h-3 w-3 md:h-4 md:w-4" /> Add Option
                </Button>
              </div>
            )}
            
            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm">Points</Label>
                  <Input
                    type="number"
                    value={question.points}
                    onChange={(e) => onUpdate({ points: parseInt(e.target.value) })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Time Limit (seconds)</Label>
                  <Input
                    type="number"
                    value={question.timeLimit}
                    onChange={(e) => onUpdate({ timeLimit: parseInt(e.target.value) })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Media</Label>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Plus className="mr-1 h-3 w-3" /> Add Image/Video/Audio
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Explanation</Label>
                  <Input
                    placeholder="Show after answer"
                    onChange={(e) => onUpdate({ explanation: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}