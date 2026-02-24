import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { ThemeSelector } from "../../../../components/ui/theme-selector";
import { DevicePreview } from "../../../../components/ui/device-preview";
import { Sparkles } from "lucide-react";
import { templates } from "../../../../lib/templates";
import type { ContextData } from "../../types";

interface Step2Props {
  context: ContextData;
  selectedTemplate: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}

export function Step2({
  context,
  selectedTemplate,
  onTitleChange,
  onDescriptionChange,
  onThemeChange,
  onCategoryChange,
  onTagsChange
}: Step2Props) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col lg:flex-row">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 w-full lg:w-[60%]">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading font-bold">Context Settings</h3>
                <Badge variant="outline" className="gap-2">
                  <Sparkles className="h-3 w-3" />
                  Template: {templates.find(t => t.id === selectedTemplate)?.name || "Custom"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={context.title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-lg font-medium"
                    placeholder="Enter a catchy title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={context.description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="What is this about?"
                    className="resize-none min-h-24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={context.category} onValueChange={onCategoryChange}>
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
                        variant={context.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          onTagsChange(
                            context.tags.includes(tag)
                              ? context.tags.filter((t) => t !== tag)
                              : [...context.tags, tag]
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
                          onTagsChange([...context.tags, e.currentTarget.value]);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Label className="mb-3 block">Visual Theme</Label>
                <ThemeSelector selectedTheme={context.theme} onSelect={onThemeChange} />
              </div>
              
              <div className="space-y-4 pt-4">
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
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:block w-[40%] bg-muted/30 border-l relative">
        <div className="absolute inset-0 bg-grid-slate-200/50 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50" />
        
        <div className="relative h-full p-8 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Live Preview
            </h3>
            <Badge variant="outline" className="text-xs">
              Auto-updates
            </Badge>
          </div>
          
          <div className="flex-1">
            <DevicePreview 
              title={context.title} 
              themeId={context.theme} 
              questions={context.questions} 
              currentQuestionIndex={0} 
            />
          </div>
          
          <div className="mt-4 p-4 bg-background/80 backdrop-blur rounded-xl border text-xs text-muted-foreground text-center">
            This is how your participants will see the experience on their devices.
            Changes are reflected in real-time.
          </div>
        </div>
      </div>
    </div>
  );
}