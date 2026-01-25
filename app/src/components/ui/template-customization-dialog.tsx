// components/ui/template-customization-dialog.tsx - FIXED VERSION
import { useState } from "react";
import { Button } from "./button";
import { Label } from "./label";
import { 
  Check,
  X,
  Settings,
  Users,
  Clock,
  Star,
  FileText,
  Image as ImageIcon} from "lucide-react";
import { Switch } from "./switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Badge } from "./badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { useToast } from "../../hooks/use-toast";

interface TemplateCustomizationDialogProps {
  template: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomize: (options: TemplateCustomizationOptions) => void;
}

interface TemplateCustomizationOptions {
  includeQuestions: boolean;
  includeSettings: boolean;
  includeImages: boolean;
  includeSampleData: boolean;
  audienceSize: string;
  customTitle: string;
}

export function TemplateCustomizationDialog({
  template,
  open,
  onOpenChange,
  onCustomize
}: TemplateCustomizationDialogProps) {
  const [options, setOptions] = useState<TemplateCustomizationOptions>({
    includeQuestions: true,
    includeSettings: true,
    includeImages: false,
    includeSampleData: true,
    audienceSize: "medium",
    customTitle: template?.name || ""
  });
  
  const { toast } = useToast();

  const audienceSizes = [
    { id: "small", name: "Small (1-10)", icon: Users, description: "Small team or classroom" },
    { id: "medium", name: "Medium (10-50)", icon: Users, description: "Department or medium group" },
    { id: "large", name: "Large (50-200)", icon: Users, description: "Company-wide or large event" },
  ];

  const handleApply = () => {
    if (!options.customTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a custom title for your quiz",
        variant: "destructive",
      });
      return;
    }

    onCustomize(options);
    onOpenChange(false);
    
    toast({
      title: "Template customized",
      description: "Your template has been configured with your preferences",
    });
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Customize Template
          </DialogTitle>
          <DialogDescription>
            Configure how you want to use the "{template.name}" template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Preview */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <template.icon className="h-5 w-5" />
                  <h3 className="font-bold">{template.name}</h3>
                  <Badge>{template.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    {template.questions?.length || 0} questions
                  </div>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-lg ${template.color}`} />
            </div>
          </div>

          {/* Custom Title */}
          <div className="space-y-2">
            <Label>Custom Title</Label>
            <input
              type="text"
              value={options.customTitle}
              onChange={(e) => setOptions({...options, customTitle: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-lg font-medium"
              placeholder="Enter a custom title..."
            />
            <p className="text-sm text-muted-foreground">
              This will be the name of your quiz/survey
            </p>
          </div>

          {/* Import Options */}
          <div className="space-y-4">
            <h4 className="font-medium">What to Include</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Questions ({template.questions?.length || 0})</Label>
                    <p className="text-sm text-muted-foreground">
                      Pre-written questions from template
                    </p>
                  </div>
                </div>
                <Switch
                  checked={options.includeQuestions}
                  onCheckedChange={(checked) => 
                    setOptions({...options, includeQuestions: checked})
                  }
                />
              </div>

              {template.settings && Object.keys(template.settings).length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <Label className="font-medium">Settings & Rules</Label>
                      <p className="text-sm text-muted-foreground">
                        Participation mode, time limits, scoring
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={options.includeSettings}
                    onCheckedChange={(checked) => 
                      setOptions({...options, includeSettings: checked})
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ImageIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Sample Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Add placeholder images to questions
                    </p>
                  </div>
                </div>
                <Switch
                  checked={options.includeImages}
                  onCheckedChange={(checked) => 
                    setOptions({...options, includeImages: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Sample Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Add sample answers and explanations
                    </p>
                  </div>
                </div>
                <Switch
                  checked={options.includeSampleData}
                  onCheckedChange={(checked) => 
                    setOptions({...options, includeSampleData: checked})
                  }
                />
              </div>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Audience Size</Label>
              <Select 
                value={options.audienceSize} 
                onValueChange={(value) => setOptions({...options, audienceSize: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {audienceSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      <div className="flex items-center gap-2">
                        <size.icon className="h-4 w-4" />
                        <div>
                          <div>{size.name}</div>
                          <div className="text-xs text-muted-foreground">{size.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Time Estimate</Label>
              <Select 
                value="standard"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Quick (2-5 mins)
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Standard (5-10 mins)
                    </div>
                  </SelectItem>
                  <SelectItem value="comprehensive">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Comprehensive (10-20 mins)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleApply}>
            <Check className="h-4 w-4 mr-2" />
            Apply Customization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}