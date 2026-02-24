import type { ContextData, Question } from "../../types";
import { Step1 } from "./Step1";
import { Step2 } from "./Step2";
import { Step3 } from "./Step3";
import { Step4 } from "./Step4";
import { Step5 } from "./Step5";

interface StepsProps {
  step: number;
  setStep: (step: number) => void;
  context: ContextData;
  selectedTemplate: string | null;
  showTemplateCustomization: boolean;
  setShowTemplateCustomization: (show: boolean) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  selectedQuestions: number[];
  leftPanelTab: 'types' | 'bulk';
  setLeftPanelTab: (tab: 'types' | 'bulk') => void;
  activeTab: 'workspace' | 'preview';
  setActiveTab: (tab: 'workspace' | 'preview') => void;
  activeDragId: string | null;
  setActiveDragId: (id: string | null) => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  historyIndex: number;
  history: ContextData[];
  
  // Actions
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onSettingsChange: (updates: any) => void;
  onTemplateSelect: (templateId: string) => void;
  onTemplateCustomize: (options: any) => void;
  onAddQuestion: (type: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onReorderQuestions: (questions: Question[]) => void;
  onToggleQuestionSelection: (index: number) => void;
  onBulkUpdate: (questions: Question[]) => void;
  onSelectAllQuestions: () => void;
  onClearSelection: () => void;
  onReorderSelectedQuestions: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onDuplicateCurrentQuestion: () => void;
  onDeleteCurrentQuestion: () => void;
  onQuickAction: (action: string) => void;
  onManualSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onHandleCreate: () => void;
}

export function renderStep({
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
  onTitleChange,
  onDescriptionChange,
  onThemeChange,
  onCategoryChange,
  onTagsChange,
  onSettingsChange,
  onTemplateSelect,
  onTemplateCustomize,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onReorderQuestions,
  onToggleQuestionSelection,
  onBulkUpdate,
  onSelectAllQuestions,
  onClearSelection,
  onReorderSelectedQuestions,
  onDuplicateCurrentQuestion,
  onDeleteCurrentQuestion,
  onQuickAction,
  onManualSave,
  onUndo,
  onRedo,
  onHandleCreate
}: StepsProps) {
  switch (step) {
    case 1:
      return (
        <Step1
          selectedTemplate={selectedTemplate}
          showTemplateCustomization={showTemplateCustomization}
          setShowTemplateCustomization={setShowTemplateCustomization}
          onTemplateSelect={onTemplateSelect}
          onTemplateCustomize={onTemplateCustomize}
        />
      );
    
    case 2:
      return (
        <Step2
          context={context}
          selectedTemplate={selectedTemplate}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onThemeChange={onThemeChange}
          onCategoryChange={onCategoryChange}
          onTagsChange={onTagsChange}
        />
      );
    
    case 3:
      return (
        <Step3
          context={context}
          currentQuestionIndex={currentQuestionIndex}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          selectedQuestions={selectedQuestions}
          leftPanelTab={leftPanelTab}
          setLeftPanelTab={setLeftPanelTab}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeDragId={activeDragId}
          setActiveDragId={setActiveDragId}
          saveStatus={saveStatus}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          historyIndex={historyIndex}
          history={history}
          onAddQuestion={onAddQuestion}
          onUpdateQuestion={onUpdateQuestion}
          onDeleteQuestion={onDeleteQuestion}
          onReorderQuestions={onReorderQuestions}
          onToggleQuestionSelection={onToggleQuestionSelection}
          onBulkUpdate={onBulkUpdate}
          onSelectAllQuestions={onSelectAllQuestions}
          onClearSelection={onClearSelection}
          onReorderSelectedQuestions={onReorderSelectedQuestions}
          onDuplicateCurrentQuestion={onDuplicateCurrentQuestion}
          onDeleteCurrentQuestion={onDeleteCurrentQuestion}
          onQuickAction={onQuickAction}
          onManualSave={onManualSave}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      );
    
    case 4:
      return (
        <Step4
          context={context}
          onSettingsChange={onSettingsChange}
        />
      );
    
    case 5:
      return (
        <Step5
          context={context}
          onHandleCreate={onHandleCreate}
        />
      );
    
    default:
      return null;
  }
}