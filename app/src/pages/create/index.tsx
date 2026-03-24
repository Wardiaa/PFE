import { useState } from "react";
import { Button } from "../../components/ui/button";
import { ArrowLeft, ChevronRight, Save } from "lucide-react";
import { useQuizBuilder } from "./hooks/useQuizBuilder";
import { renderStep } from "./components/steps";
import { useNavigate } from "react-router-dom";
import { Header } from "./components/Header";
import { PreviewModal } from "./components/PreviewModal";

export default function EnhancedCreate() {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
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

  const currentQuestion = context.questions[currentQuestionIndex] || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        step={step}
        setStep={setStep}
        onPublish={handleCreate}
        onSaveDraft={handleManualSave}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        onPreview={() => setIsPreviewOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      <main className="flex-1 overflow-hidden w-full">
        <div className="p-0 h-full">
          {currentStep}
        </div>
      </main>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        question={currentQuestion}
        presentationSettings={context.settings}
        questions={context.questions}
        currentQuestionIndex={currentQuestionIndex}
      />
    </div>
  );
}