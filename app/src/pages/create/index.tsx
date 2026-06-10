// EnhancedCreate.tsx
// MODE SELECTION UPDATE: Added ModeSelection screen for blank templates
// SKIP UPDATE: Added onMaxSkipsChange prop

import { useState } from "react";
import { useQuizBuilder } from "./hooks/useQuizBuilder";
import { renderStep } from "./components/steps";
import { Header } from "./components/Header";
import { PreviewModal } from "./components/PreviewModal";
import { ModeSelection, type GameMode } from "./components/ModeSelection";
import DeleteQuestionConfirmModal from "./components/DeleteQuestionConfirmModal";

export default function EnhancedCreate() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

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
    handleGameModeChange,
    handleMaxSkipsChange,
    showModeSelection,
    setShowModeSelection,
  } = useQuizBuilder();

  // If we're showing mode selection screen (only for blank template)
  if (showModeSelection && selectedTemplate === "custom-blank") {
    return (
      <ModeSelection
        selectedMode={selectedMode}
        onSelectMode={(mode) => {
          setSelectedMode(mode);
          handleGameModeChange(mode);
        }}
        onContinue={() => {
          setShowModeSelection(false);
          setStep(2);
        }}
      />
    );
  }

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
    onReorderQuestions: handleBulkUpdate, // FIX: was () => {} (no-op); handleBulkUpdate dispatches SET_QUESTIONS with reordered array + adds to undo/redo history
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
    onGameModeChange: handleGameModeChange,
    onMaxSkipsChange: handleMaxSkipsChange,
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

      <DeleteQuestionConfirmModal
        isOpen={!!pendingDeleteQuestion}
        questionTitle={pendingDeleteQuestion?.title || ""}
        onCancel={cancelDeleteQuestion}
        onConfirm={confirmDeleteQuestion}
      />
    </div>
  );
}