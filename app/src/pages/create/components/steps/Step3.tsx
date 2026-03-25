// Step3.tsx (updated - fully responsive)
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
  FileQuestion, 
  Plus, 
  GripVertical, 
  Layers,
  Sparkles,
  ChevronRight
} from "lucide-react";
import type { ContextData, Question } from "../../types";
import { BulkActions } from "../BulkActions";
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => setActiveDragId(event.active.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = context.questions.findIndex(q => q.id === active.id);
      const newIndex = context.questions.findIndex(q => q.id === over.id);
      onReorderQuestions(arrayMove(context.questions, oldIndex, newIndex));
    }
    setActiveDragId(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] flex flex-col md:flex-row w-full bg-slate-50 font-sans">
      
      {/* LEFT PANEL - Hidden on mobile by default, can be toggled */}
      <div
        className="w-full md:w-80 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0 md:block"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
      >
        <div className="px-4 sm:px-5 pt-4 sm:pt-6 pb-4">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] sm:tracking-[0.3em]">
                Studio Tools
              </span>
            </div>
          </div>

          {/* Tab Toggle */}
          <div className="relative flex bg-slate-100 rounded-xl p-1 border border-slate-200 mb-4 sm:mb-6">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-indigo-600 shadow-sm transition-all duration-300 ease-out"
              style={{
                left: leftPanelTab === 'types' ? '4px' : 'calc(50% + 0px)',
                width: 'calc(50% - 4px)'
              }}
            />
            {[
              { key: 'types', icon: <Layers className="w-3 h-3" />, short: 'Types' },
              { key: 'bulk',  icon: <Sparkles className="w-3 h-3" />, short: 'Bulk' }
            ].map(({ key, icon, short }) => (
              <button
                key={key}
                onClick={() => setLeftPanelTab(key as any)}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors duration-200 ${
                  leftPanelTab === key ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {icon}
                <span>{short}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-6">
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

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Question Canvas */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.03) 0%, transparent 70%)'
          }}
        >
          {context.questions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
              <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 bg-indigo-100 rounded-full blur-2xl scale-150" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.75rem] bg-white border border-slate-200 flex items-center justify-center shadow-lg">
                  <FileQuestion className="w-7 h-7 sm:w-9 sm:h-9 text-slate-300" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3 tracking-tight">Start Building</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mb-6 sm:mb-8 leading-relaxed px-2">
                Select a question type from the left panel to add your first interaction.
              </p>
              <button
                onClick={() => setLeftPanelTab('types')}
                className="flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-indigo-200 hover:-translate-y-px"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Add First Question
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <div className="max-w-2xl lg:max-w-3xl mx-auto space-y-3">
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
                  {context.questions.map((question, index) => (
                    <SortableQuestionCard
                      key={question.id}
                      id={question.id}
                      question={question}
                      index={index}
                      isCurrent={currentQuestionIndex === index}
                      isSelected={selectedQuestions.includes(index)}
                      onQuestionClick={setCurrentQuestionIndex}
                      onToggleSelect={onToggleQuestionSelection}
                      onUpdate={onUpdateQuestion}
                      onDelete={onDeleteQuestion}
                      activeDragId={activeDragId}
                    />
                  ))}
                </SortableContext>

                <DragOverlay>
                  {activeDragId && (
                    <div className="rounded-xl sm:rounded-2xl border border-indigo-200 bg-white shadow-xl shadow-indigo-100/60 p-3 sm:p-4 rotate-1 opacity-90">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">
                          {context.questions.find(q => q.id === activeDragId)?.title}
                        </span>
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>

              <div className="mt-4">
                <button
                  onClick={() => setLeftPanelTab('types')}
                  className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-dashed border-slate-300 bg-white/60 hover:bg-indigo-50 hover:border-indigo-300 transition-all group flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] group-hover:text-indigo-500 transition-colors">
                    Add Question
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
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