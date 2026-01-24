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
  Sparkles
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
    icon: "🏆",
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
    icon: "📊",
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
    icon: "✋",
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
    icon: "🎮",
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
    icon: "⭐",
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
    icon: "📝",
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
    icon: "❄️",
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
    icon: "🎨",
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
  const [step, setStep] = useState(1); // 1: Template, 2: Details, 3: Questions, 4: Settings, 5: Preview
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Context details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("default");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // Settings
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 1 of 5
        </div>
        <h2 className="text-3xl font-heading font-bold">Choose a Template</h2>
        <p className="text-muted-foreground">Start with a pre-made template or create from scratch</p>
      </div>
      
      <Tabs defaultValue="popular" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <TabsContent value="education" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <TabsContent value="business" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <TabsContent value="games" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      
      <div className="pt-8 border-t">
        <Button
          variant="outline"
          className="w-full py-8 border-dashed"
          onClick={() => {
            setSelectedTemplate("custom");
            setStep(2);
          }}
        >
          <Plus className="mr-2 h-5 w-5" />
          <div className="text-left">
            <div className="font-bold">Start from Scratch</div>
            <div className="text-sm text-muted-foreground">Full customization, no templates</div>
          </div>
        </Button>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 2 of 5
        </div>
        <h2 className="text-3xl font-heading font-bold">Customize Details</h2>
        <p className="text-muted-foreground">Set up the basic information and appearance</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Team Knowledge Challenge"
              className="text-lg h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this context is about..."
              className="min-h-[120px]"
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
                className="w-32"
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
        
        <div className="space-y-6">
          <ThemeSelector value={theme} onChange={setTheme} />
          
          <div className="space-y-4">
            <h3 className="font-medium">Cover Image</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w-600",
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
      
      <div className="flex justify-between pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(3)}>
          Next: Questions <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 3 of 5
        </div>
        <h2 className="text-3xl font-heading font-bold">Design Questions</h2>
        <p className="text-muted-foreground">Add and customize your questions</p>
      </div>
      
      <div className="space-y-6">
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
        className="w-full py-8 border-dashed"
        onClick={addQuestion}
      >
        <Plus className="mr-2 h-5 w-5" />
        <div className="text-left">
          <div className="font-bold">Add New Question</div>
          <div className="text-sm text-muted-foreground">Choose from various question types</div>
        </div>
      </Button>
      
      <div className="flex justify-between pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(4)}>
          Next: Settings <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
  
  const renderStep4 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 4 of 5
        </div>
        <h2 className="text-3xl font-heading font-bold">Configure Settings</h2>
        <p className="text-muted-foreground">Fine-tune participation rules and experience</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5" /> Participation
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Participation Mode</Label>
                <p className="text-sm text-muted-foreground">Who can join?</p>
              </div>
              <Select
                value={settings.participationMode}
                onValueChange={(value) =>
                  setSettings({ ...settings, participationMode: value })
                }
              >
                <SelectTrigger className="w-[180px]">
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
              <div className="flex items-center justify-between">
                <div>
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
              
              <div className="flex items-center justify-between">
                <div>
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
              
              <div className="flex items-center justify-between">
                <div>
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
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" /> Game Rules
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Time Limit (minutes)</Label>
                <p className="text-sm text-muted-foreground">Overall time limit</p>
              </div>
              <Input
                type="number"
                value={settings.timeLimit}
                onChange={(e) =>
                  setSettings({ ...settings, timeLimit: parseInt(e.target.value) })
                }
                className="w-24"
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
              <div className="flex items-center justify-between">
                <div>
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
              
              <div className="flex items-center justify-between">
                <div>
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
              
              <div className="flex items-center justify-between">
                <div>
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
              
              <div className="flex items-center justify-between">
                <div>
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
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Music className="h-5 w-5" /> Audio & Effects
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
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
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
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
      
      <div className="flex justify-between pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(3)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(5)}>
          Next: Preview <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
  
  const renderStep5 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Step 5 of 5
        </div>
        <h2 className="text-3xl font-heading font-bold">Preview & Launch</h2>
        <p className="text-muted-foreground">Review your creation before publishing</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2">
            <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 relative">
              <div className="absolute bottom-4 left-6">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  Preview Mode
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{title || "Your Context Title"}</h3>
                  <p className="text-muted-foreground">
                    {description || "Context description will appear here"}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg">
                  {questions.length} Qs
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {questions.reduce((sum, q) => sum + q.points, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{settings.timeLimit}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{settings.maxParticipants}</div>
                  <div className="text-sm text-muted-foreground">Max Players</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-bold">Settings Summary:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {settings.participationMode === "PUBLIC" ? "🌐 Public" : 
                     settings.participationMode === "INVITE_ONLY" ? "🔒 Invite Only" : "🔑 Code Required"}
                  </Badge>
                  <Badge variant="secondary">
                    {settings.requireAccount ? "👤 Account Required" : "🎭 Guest Allowed"}
                  </Badge>
                  <Badge variant="secondary">
                    {settings.showLeaderboard ? "🏆 Leaderboard" : "📊 No Leaderboard"}
                  </Badge>
                  <Badge variant="secondary">
                    {settings.soundEffects ? "🔊 Sound On" : "🔇 Sound Off"}
                  </Badge>
                  <Badge variant="secondary">
                    {settings.shuffleQuestions ? "🎲 Shuffled" : "📝 Sequential"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h4 className="font-bold mb-4">Share Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-4">
                  <QrCode className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-bold">QR Code</div>
                    <div className="text-xs text-muted-foreground">Scan to join</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4">
                  <Copy className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-bold">Copy Link</div>
                    <div className="text-xs text-muted-foreground">Share via URL</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4">
                  <Download className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-bold">Export</div>
                    <div className="text-xs text-muted-foreground">PDF/CSV template</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
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
            <CardContent className="p-6">
              <h4 className="font-bold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Duplicate Template
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Schedule Launch
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Set Reminders
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Test Participation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-between pt-8 border-t">
        <Button variant="outline" onClick={() => setStep(4)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
        </Button>
        <div className="flex gap-3">
          <Button variant="outline">
            Save as Template
          </Button>
          <Button size="lg" onClick={handleCreate}>
            <Save className="mr-2 h-5 w-5" /> Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (step === 1 ? navigate("/dashboard") : setStep(step - 1))}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-bold">
                {step === 1 && "Choose Template"}
                {step === 2 && "Customize Details"}
                {step === 3 && "Design Questions"}
                {step === 4 && "Configure Settings"}
                {step === 5 && "Preview & Launch"}
              </h1>
              <p className="text-muted-foreground">
                Create an engaging interactive experience
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" /> Save Draft
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex flex-col items-center ${
                  s <= step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                    s < step
                      ? "bg-primary border-primary text-primary-foreground"
                      : s === step
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                <span className="text-xs">
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
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Simple" : "Advanced"}
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-primary/10 text-primary h-10 w-10 rounded-lg flex items-center justify-center font-bold shrink-0">
            Q{index + 1}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <Input
                value={question.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Enter your question here..."
                className="text-xl font-bold border-0 p-0 focus-visible:ring-0"
              />
              <Textarea
                placeholder="Add description (optional)"
                className="mt-2 border-0 p-0 focus-visible:ring-0 resize-none"
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
                  <div key={option.id} className="flex items-center gap-3">
                    <div
                      className={`h-6 w-6 rounded-full border-2 cursor-pointer flex items-center justify-center ${
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
                      {option.isCorrect && "✓"}
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...question.options];
                        newOptions[optIndex] = { ...option, text: e.target.value };
                        onUpdate({ options: newOptions });
                      }}
                      placeholder={`Option ${optIndex + 1}`}
                      className="flex-1"
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
                >
                  + Add Option
                </Button>
              </div>
            )}
            
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={question.points}
                    onChange={(e) => onUpdate({ points: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Limit (seconds)</Label>
                  <Input
                    type="number"
                    value={question.timeLimit}
                    onChange={(e) => onUpdate({ timeLimit: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Media</Label>
                  <Button variant="outline" size="sm" className="w-full">
                    + Add Image/Video/Audio
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Explanation</Label>
                  <Input
                    placeholder="Show after answer"
                    onChange={(e) => onUpdate({ explanation: e.target.value })}
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