import { Button } from "../../../../components/ui/button";
import { QuestionTypeSelector } from "../../../../components/ui/question-type-selector";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  type DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  X, 
  FileQuestion, 
  Plus, 
  GripVertical, 
  Undo, 
  Redo, 
  Check,
  Save as SaveIcon,
  RotateCcw
} from "lucide-react";
import type { ContextData, Question } from "../../types";
import { BulkActions } from "../BulkActions";
import { PreviewPanel } from "../PreviewPanel";
import { SortableQuestionCard } from "../SortableQuestionCard";
import { QuickActionsPanel } from "../QuickActionsPanel";

interface Step3Props {
  context: ContextData;
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
}

export function Step3({
  context,
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
  onRedo
}: Step3Props) {
  
  const currentQuestion = context.questions[currentQuestionIndex] || null;
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = context.questions.findIndex(q => q.id === active.id);
      const newIndex = context.questions.findIndex(q => q.id === over.id);
      
      const newQuestions = arrayMove(context.questions, oldIndex, newIndex);
      onReorderQuestions(newQuestions);
    }
    
    setActiveDragId(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row w-full">
      <div className="lg:hidden border-b border-border bg-card">
        <div className="flex">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'workspace' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className={`w-full lg:w-80 border-r border-border bg-card overflow-y-auto custom-scrollbar ${
        activeTab === 'workspace' ? 'block' : 'hidden lg:block'
      }`}>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Builder Tools</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setActiveTab('workspace')}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setLeftPanelTab('types')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                leftPanelTab === 'types' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Question Types
            </button>
            <button
              onClick={() => setLeftPanelTab('bulk')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                leftPanelTab === 'bulk' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Bulk Actions
            </button>
          </div>

          {leftPanelTab === 'types' ? (
            <QuestionTypeSelector
              onSelect={onAddQuestion}
              selectedType={currentQuestion?.uiType || currentQuestion?.type}
            />
          ) : (
            <BulkActions
              questions={context.questions}
              onUpdateQuestions={onBulkUpdate}
              selectedQuestions={selectedQuestions}
              onSelectAll={onSelectAllQuestions}
              onClearSelection={onClearSelection}
              onReorderQuestions={onReorderSelectedQuestions}
            />
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col overflow-hidden ${
        activeTab === 'workspace' ? 'block' : 'hidden lg:block'
      }`}>
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-card">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1 truncate">
              {context.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {context.questions?.length} {context.questions?.length === 1 ? 'question' : 'questions'}
              {hasUnsavedChanges && ' • Unsaved changes'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={historyIndex === 0}
                className={historyIndex === 0 ? "opacity-50" : ""}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={historyIndex === history.length - 1}
                className={historyIndex === history.length - 1 ? "opacity-50" : ""}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
            
            {saveStatus === 'saving' ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RotateCcw className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            ) : saveStatus === 'saved' ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Saved
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SaveIcon className="w-4 h-4" />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SaveIcon className="w-4 h-4" />
                Not saved
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onManualSave}
              className="hidden md:flex"
              title="Save (Ctrl+S)"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          {context.questions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <FileQuestion className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Questions Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Start building your presentation by selecting a question type from the left panel
              </p>
              <Button
                variant="default"
                onClick={() => setLeftPanelTab('types')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={context.questions.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {context.questions.map((question, index) => {
                    const isCurrent = currentQuestionIndex === index;
                    const isSelected = selectedQuestions.includes(index);
                    
                    return (
                      <SortableQuestionCard
                        key={question.id}
                        id={question.id}
                        question={question}
                        index={index}
                        isCurrent={isCurrent}
                        isSelected={isSelected}
                        onQuestionClick={setCurrentQuestionIndex}
                        onToggleSelect={onToggleQuestionSelection}
                        onUpdate={onUpdateQuestion}
                        onDelete={onDeleteQuestion}
                        activeDragId={activeDragId}
                      />
                    );
                  })}
                </SortableContext>
                
                <DragOverlay>
                  {activeDragId && (
                    <div className="border rounded-lg overflow-hidden bg-card shadow-xl opacity-80 rotate-2">
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">
                            {context.questions.find(q => q.id === activeDragId)?.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
              
              <div className="p-4 border-2 border-dashed rounded-xl text-center bg-muted/30 hover:bg-muted/50 transition-colors">
                <p className="text-sm text-muted-foreground mb-4">Add a new question type</p>
                <QuestionTypeSelector onSelect={onAddQuestion} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`w-full lg:w-96 xl:w-[480px] border-l border-border bg-card overflow-hidden ${
        activeTab === 'preview' ? 'block' : 'hidden lg:block'
      }`}>
        <PreviewPanel
          question={currentQuestion}
          presentationSettings={context.settings}
          questions={context.questions}
          currentQuestionIndex={currentQuestionIndex}
        />
      </div>

      <QuickActionsPanel
        questions={context.questions}
        currentQuestionIndex={currentQuestionIndex}
        onAddQuestion={onAddQuestion}
        onDuplicateQuestion={onDuplicateCurrentQuestion}
        onDeleteQuestion={onDeleteCurrentQuestion}
        onUpdateQuestion={(updates) => {
          if (currentQuestionIndex >= 0) {
            const questionId = context.questions[currentQuestionIndex].id;
            onUpdateQuestion(questionId, updates);
          }
        }}
        onBulkAction={onQuickAction}
      />
    </div>
  );
}