import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { TemplateCard } from "../../../../components/ui/template-card";
import { TemplateCustomizationDialog } from "../../../../components/ui/template-customization-dialog";
import { Sparkles } from "lucide-react";
import { templates } from "../../../../lib/templates";

interface Step1Props {
  selectedTemplate: string | null;
  showTemplateCustomization: boolean;
  setShowTemplateCustomization: (show: boolean) => void;
  onTemplateSelect: (templateId: string) => void;
  onTemplateCustomize: (options: any) => void;
}

export function Step1({
  selectedTemplate,
  showTemplateCustomization,
  setShowTemplateCustomization,
  onTemplateSelect,
  onTemplateCustomize
}: Step1Props) {
  return (
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
              {templates
                .filter(t => tab === 'all' || 
                  (tab === 'education' && t.category === 'Education') ||
                  (tab === 'business' && (t.category === 'Business' || t.category === 'HR')) ||
                  (tab === 'fun' && (t.category === 'Entertainment' || t.category === 'Team Building'))
                )
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    id={template.id}
                    name={template.name}
                    description={template.description}
                    icon={template.icon}
                    category={template.category}
                    questionsCount={template.questions ? template.questions.length : 0}
                    color={template.color}
                    popularity={template.popularity}
                    isNew={template.isNew}
                    selected={selectedTemplate === template.id}
                    onClick={() => onTemplateSelect(template.id)}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <TemplateCustomizationDialog
        template={templates.find(t => t.id === selectedTemplate)}
        open={showTemplateCustomization}
        onOpenChange={setShowTemplateCustomization}
        onCustomize={onTemplateCustomize}
      />
    </div>
  );
}