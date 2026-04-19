// EnhancedCreate.tsx
import { useState } from "react";
import { useQuizBuilder } from "./hooks/useQuizBuilder";
import { renderStep } from "./components/steps";
import { Header } from "./components/Header";
import { PreviewModal } from "./components/PreviewModal";
import DeleteQuestionConfirmModal from "./components/DeleteQuestionConfirmModal";

export default function EnhancedCreate() {
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
    isPublishing,
    isSavingDraft,
    pendingDeleteQuestion,
    confirmDeleteQuestion,
    cancelDeleteQuestion,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    handleTitleChange,
    handleDescriptionChange,
    handleThemeChange,
    handleCategoryChange,
    handleTagsChange,
    handleCoverImageChange,
    handleSettingsChange,
    toggleQuestionSelection,
    handleTemplateSelect,
    handleTemplateCustomize,
    handleCreate,
    handleSaveDraft,
    handleBackgroundSave,
    handleSelectAllQuestions,
    handleClearSelection,
    handleBulkUpdate,
    handleDuplicateCurrentQuestion,
    handleDeleteCurrentQuestion,
    handleReorderQuestions,
    handleQuickAction,
    handleManualSave,
    handleUndo,
    handleRedo,
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
    isPublishing,
    isSavingDraft,
    onTitleChange: handleTitleChange,
    onDescriptionChange: handleDescriptionChange,
    onThemeChange: handleThemeChange,
    onCategoryChange: handleCategoryChange,
    onTagsChange: handleTagsChange,
    onCoverImageChange: handleCoverImageChange,
    onSettingsChange: handleSettingsChange,
    onTemplateSelect: handleTemplateSelect,
    onTemplateCustomize: handleTemplateCustomize,
    onAddQuestion: addQuestion,
    onUpdateQuestion: updateQuestion,
    onDeleteQuestion: deleteQuestion,
    onReorderQuestions: () => {},
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
    onHandleCreate: handleCreate,
    onSaveDraft: handleSaveDraft,
  });

  const currentQuestion = context.questions[currentQuestionIndex] || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        step={step}
        setStep={setStep}
        onPublish={handleCreate}
        onSaveDraft={handleBackgroundSave}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        onPreview={() => setIsPreviewOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        contextTitle={context.title || "Untitled Session"}
      />

      <main className="flex-1 overflow-hidden w-full">
        <div className="p-0 h-full">
          {currentStep}
        </div>
      </main>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        question={currentQuestion}
        presentationSettings={context.settings}
        questions={context.questions}
        currentQuestionIndex={currentQuestionIndex}
      />

      {/* Delete confirmation modal */}
      <DeleteQuestionConfirmModal
        isOpen={!!pendingDeleteQuestion}
        questionTitle={pendingDeleteQuestion?.title || ""}
        onCancel={cancelDeleteQuestion}
        onConfirm={confirmDeleteQuestion}
      />
    </div>
  );
}
