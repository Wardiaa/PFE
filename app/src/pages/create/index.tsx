import { Button } from "../../components/ui/button";
import { ArrowLeft, ChevronRight, Save } from "lucide-react";
import { useQuizBuilder } from "./hooks/useQuizBuilder";
import { renderStep } from "./components/steps";
import { useNavigate } from "react-router-dom";

export default function EnhancedCreate() {
  const navigate = useNavigate();
  
  const {
    step,
    setStep,
    selectedTemplate,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedQuestions,
    showTemplateCustomization,
    setShowTemplateCustomization,
    lastSaved,
    saveStatus,
    hasUnsavedChanges,
    activeDragId,
    setActiveDragId,
    activeTab,
    setActiveTab,
    leftPanelTab,
    setLeftPanelTab,
    context,
    history,
    historyIndex,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    handleTitleChange,
    handleDescriptionChange,
    handleThemeChange,
    handleCategoryChange,
    handleTagsChange,
    handleSettingsChange,
    toggleQuestionSelection,
    handleTemplateSelect,
    handleTemplateCustomize,
    handleCreate,
    handleSelectAllQuestions,
    handleClearSelection,
    handleBulkUpdate,
    handleDuplicateCurrentQuestion,
    handleDeleteCurrentQuestion,
    handleReorderQuestions,
    handleQuickAction,
    handleManualSave,
    handleUndo,
    handleRedo
  } = useQuizBuilder();

  const currentStep = renderStep({
    step,
    setStep,
    context,
    selectedTemplate,
    showTemplateCustomization,
    setShowTemplateCustomization,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedQuestions,
    leftPanelTab,
    setLeftPanelTab,
    activeTab,
    setActiveTab,
    activeDragId,
    setActiveDragId,
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    historyIndex,
    history,
    onTitleChange: handleTitleChange,
    onDescriptionChange: handleDescriptionChange,
    onThemeChange: handleThemeChange,
    onCategoryChange: handleCategoryChange,
    onTagsChange: handleTagsChange,
    onSettingsChange: handleSettingsChange,
    onTemplateSelect: handleTemplateSelect,
    onTemplateCustomize: handleTemplateCustomize,
    onAddQuestion: addQuestion,
    onUpdateQuestion: updateQuestion,
    onDeleteQuestion: deleteQuestion,
    onReorderQuestions: (questions) => {
      // This will be handled by the reducer
    },
    onToggleQuestionSelection: toggleQuestionSelection,
    onBulkUpdate: handleBulkUpdate,
    onSelectAllQuestions: handleSelectAllQuestions,
    onClearSelection: handleClearSelection,
    onReorderSelectedQuestions: handleReorderQuestions,
    onDuplicateCurrentQuestion: handleDuplicateCurrentQuestion,
    onDeleteCurrentQuestion: handleDeleteCurrentQuestion,
    onQuickAction: handleQuickAction,
    onManualSave: handleManualSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onHandleCreate: handleCreate
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg">
              {step === 1 && "Create New"}
              {step === 2 && "Customize Details"}
              {step === 3 && "Design Questions"}
              {step === 4 && "Configure Settings"}
              {step === 5 && "Preview & Launch"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {step === 1 && "Select a template"}
              {step === 2 && "Edit basic information"}
              {step === 3 && "Add and customize questions"}
              {step === 4 && "Set up participation rules"}
              {step === 5 && "Review and publish"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {step > 1 && step < 5 && (
            <Button variant="outline" className="gap-2" onClick={() => setStep(step + 1)}>
              Next Step <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-hidden w-full">
        <div className="p-0 h-full">
          {currentStep}
          
          {step > 1 && step < 5 && step !== 3 && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t mt-8 p-4 md:p-8">
              <Button variant="outline" onClick={() => setStep(step - 1)} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(step + 1)} className="w-full sm:w-auto">
                Next: {step === 2 && "Questions"}
                {step === 3 && "Settings"}
                {step === 4 && "Preview"}
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </div>
          )}
          
          {step === 5 && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t mt-8 p-4 md:p-8">
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
          )}
        </div>
      </main>
    </div>
  );
}