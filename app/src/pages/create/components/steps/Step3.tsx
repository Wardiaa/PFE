// Step3.tsx - COMPLETE WITH SQUISH EFFECT & INTEGRATED SIDEPANEL
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
  Grid3x3,
  List,
  Settings2,
  ChevronLeft,
  X
} from "lucide-react";
import type { ContextData, Question } from "../../types";
import { BulkActions } from "../BulkActions";
import { SortableQuestionCard } from "../SortableQuestionCard";
import { QuickActionsPanel } from "../QuickActionsPanel";
import { QuestionSidePanel } from "../QuestionSidePanel";
import { useState, useRef } from "react";
import { cn } from "../../../../lib/utils";

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
  
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drives the squish effect
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true); 
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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

  const filteredQuestions = context.questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: context.questions.length,
    withTimeLimit: context.questions.filter(q => q.timeLimit).length,
    withPoints: context.questions.filter(q => q.points > 0).length,
    totalPoints: context.questions.reduce((sum, q) => sum + (q.points || 0), 0),
    avgTime: Math.round(context.questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0) / (context.questions.length || 1))
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-white to-slate-50/50 overflow-hidden flex flex-col">
      
      {/* TOP BAR */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm z-20 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          
          {/* Left - Session Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Question Studio</h2>
                <p className="text-[10px] text-slate-400 font-medium">
                  {stats.total} {stats.total === 1 ? 'question' : 'questions'} • {stats.totalPoints} pts total
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500 font-medium">Avg {stats.avgTime}s</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-slate-500 font-medium">{stats.withTimeLimit} timed</span>
              </div>
            </div>
          </div>
          
          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>
          
          {/* Right - View Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === 'list' 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === 'grid' 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className={cn(
                "w-4 h-4 transition-transform",
                isPanelCollapsed && "rotate-180"
              )} />
            </button>
          </div>
        </div>
      </div>

      {/* BODY CONTAINER */}
      <div className="flex-1 flex relative overflow-hidden bg-[#F8FAFC]">
        
        {/* LEFT PANEL - Collapsible */}
        <div className={cn(
          "h-full border-r border-slate-200 bg-white/50 backdrop-blur-sm transition-all duration-300 overflow-y-auto",
          isPanelCollapsed ? "w-0 overflow-hidden border-r-0" : "w-80"
        )}>
          <div className="p-5">
            {/* Tab Navigation */}
            <div className="relative flex bg-slate-100 rounded-xl p-1 mb-6">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-200 ease-out"
                style={{
                  left: leftPanelTab === 'types' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 4px)'
                }}
              />
              <button
                onClick={() => setLeftPanelTab('types')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors rounded-lg",
                  leftPanelTab === 'types' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              <button
                onClick={() => setLeftPanelTab('bulk')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors rounded-lg",
                  leftPanelTab === 'bulk' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Bulk</span>
              </button>
            </div>

            {/* Content */}
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

        {/* CENTER WORKSPACE - SQUISH EFFECT */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-full",
          isSidePanelOpen ? "mr-[452px]" : "mr-[92px]" 
        )}>
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-5">
            {context.questions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-50" />
                    <div className="relative w-24 h-24 mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center">
                      <FileQuestion className="w-10 h-10 text-slate-300" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Empty Canvas</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                    Your question bank is empty. Start by adding your first question.
                  </p>
                  <button
                    onClick={() => {
                      if (isPanelCollapsed) setIsPanelCollapsed(false);
                      setLeftPanelTab('types');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Question
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Question Count Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {filteredQuestions.length} {filteredQuestions.length === 1 ? 'item' : 'items'}
                    </span>
                    {searchQuery && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        Showing results for "{searchQuery}"
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Drag to reorder
                  </div>
                </div>

                {/* Question List */}
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
                    <div className={cn(
                      "space-y-3",
                      viewMode === 'grid' && "grid grid-cols-1 lg:grid-cols-2 gap-4 space-y-0"
                    )}>
                      {filteredQuestions.map((question, index) => {
                        const originalIndex = context.questions.findIndex(q => q.id === question.id);
                        return (
                          <SortableQuestionCard
                            key={question.id}
                            id={question.id}
                            question={question}
                            index={originalIndex}
                            isCurrent={currentQuestionIndex === originalIndex}
                            isSelected={selectedQuestions.includes(originalIndex)}
                            onQuestionClick={setCurrentQuestionIndex}
                            onToggleSelect={onToggleQuestionSelection}
                            onUpdate={onUpdateQuestion}
                            onDelete={onDeleteQuestion}
                            activeDragId={activeDragId}
                            viewMode={viewMode}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeDragId && (
                      <div className="bg-white rounded-xl shadow-2xl border border-indigo-200 p-3 rotate-1">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {context.questions.find(q => q.id === activeDragId)?.title}
                          </span>
                        </div>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>

                {/* Add Question Button */}
                <button
                  onClick={() => {
                    if (isPanelCollapsed) setIsPanelCollapsed(false);
                    setLeftPanelTab('types');
                  }}
                  className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 bg-white/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Add another question</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE PANEL */}
        <QuestionSidePanel
          currentQuestion={currentQuestion}
          onUpdateQuestion={(updates) => {
            if (currentQuestionIndex >= 0) {
              onUpdateQuestion(context.questions[currentQuestionIndex].id, updates);
            }
          }}
          onDuplicateQuestion={onDuplicateCurrentQuestion}
          onDeleteQuestion={onDeleteCurrentQuestion}
          isOpen={isSidePanelOpen}
          onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)}
        />
      </div>

      {/* Quick Actions FAB */}
      <QuickActionsPanel
        questions={context.questions}
        currentQuestionIndex={currentQuestionIndex}
        onAddQuestion={onAddQuestion}
        onDuplicateQuestion={onDuplicateCurrentQuestion}
        onDeleteQuestion={onDeleteCurrentQuestion}
        onUpdateQuestion={(updates) => {
          if (currentQuestionIndex >= 0) {
            onUpdateQuestion(context.questions[currentQuestionIndex].id, updates);
          }
        }}
        onBulkAction={onQuickAction}
      />
    </div>
  );
}