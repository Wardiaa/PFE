// components/ui/template-customization-dialog.tsx - REDESIGNED SLIDE-IN PANEL
import { useState, useMemo, useEffect } from "react";
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
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";
import { Switch } from "./switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Badge } from "./badge";
import { useToast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";

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

  // Memoize static data
  const audienceSizes = useMemo(() => [
    { id: "small", name: "Small (1-10)", icon: Users, description: "Small team or classroom" },
    { id: "medium", name: "Medium (10-50)", icon: Users, description: "Department or medium group" },
    { id: "large", name: "Large (50-200)", icon: Users, description: "Company-wide or large event" },
  ], []);

  // Update title when template changes
  useEffect(() => {
    if (template?.name) {
      setOptions(prev => ({ ...prev, customTitle: template.name }));
    }
  }, [template?.name]);

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

  const TemplateIcon = template.icon;
  const questionsCount = template.questions?.length || 0;
  const hasSettings = template.settings && Object.keys(template.settings).length > 0;

  return (
    <>
      {/* Backdrop Overlay - Fixed to cover entire viewport */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ width: '100vw', height: '100vh' }}
        onClick={() => onOpenChange(false)}
      />
      
      {/* Slide-in Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[600px] bg-background border-l shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", template.color)}>
                    <TemplateIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading">Customize Template</h2>
                    <p className="text-sm text-muted-foreground">{template.name}</p>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {questionsCount} questions
              </Badge>
              <Badge variant="secondary">{template.category}</Badge>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
           {/* Custom Title Section */}
<div className="space-y-3">
  <Label htmlFor="custom-title" className="text-base font-semibold">
    Quiz Title
  </Label>
  <input
    id="custom-title"
    type="text"
    value={options.customTitle}
    onChange={(e) => setOptions(prev => ({ ...prev, customTitle: e.target.value }))}
    className="w-full px-4 py-3 text-lg font-medium border rounded-lg focus:!border-primary focus:!border-2 focus:!ring-0 focus:!outline-none bg-background"
    placeholder="Enter a custom title..."
  />
  <p className="text-sm text-muted-foreground">
    Give your quiz a unique name that participants will see
  </p>
</div>

            {/* Divider */}
            <div className="border-t" />

            {/* Configuration Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Configuration</h3>
              
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="audience-size" className="text-sm font-medium">
                    Audience Size
                  </Label>
                  <Select 
                    value={options.audienceSize} 
                    onValueChange={(value) => setOptions(prev => ({ ...prev, audienceSize: value }))}
                  >
                    <SelectTrigger id="audience-size" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceSizes.map((size) => {
                        const SizeIcon = size.icon;
                        return (
                          <SelectItem key={size.id} value={size.id}>
                            <div className="flex items-center gap-2">
                              <SizeIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{size.name}</div>
                                <div className="text-xs text-muted-foreground">{size.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-estimate" className="text-sm font-medium">
                    Estimated Duration
                  </Label>
                  <Select defaultValue="standard">
                    <SelectTrigger id="time-estimate" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Quick (2-5 mins)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Standard (5-10 mins)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="comprehensive">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Comprehensive (10-20 mins)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* What to Include Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">What to Include</h3>
              
              <div className="space-y-2">
                {/* Questions Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">Questions ({questionsCount})</div>
                      <p className="text-sm text-muted-foreground">Pre-written template questions</p>
                    </div>
                  </div>
                  <Switch
                    checked={options.includeQuestions}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeQuestions: checked }))
                    }
                    className="flex-shrink-0"
                  />
                </div>

                {/* Settings Toggle */}
                {hasSettings && (
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                        <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Settings & Rules</div>
                        <p className="text-sm text-muted-foreground">Time limits, scoring rules</p>
                      </div>
                    </div>
                    <Switch
                      checked={options.includeSettings}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, includeSettings: checked }))
                      }
                      className="flex-shrink-0"
                    />
                  </div>
                )}

                {/* Images Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                      <ImageIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">Sample Images</div>
                      <p className="text-sm text-muted-foreground">Placeholder images for questions</p>
                    </div>
                  </div>
                  <Switch
                    checked={options.includeImages}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeImages: checked }))
                    }
                    className="flex-shrink-0"
                  />
                </div>

                {/* Sample Data Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                      <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">Sample Data</div>
                      <p className="text-sm text-muted-foreground">Example answers and explanations</p>
                    </div>
                  </div>
                  <Switch
                    checked={options.includeSampleData}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeSampleData: checked }))
                    }
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              className="flex-1 gap-2"
            >
              Apply & Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}