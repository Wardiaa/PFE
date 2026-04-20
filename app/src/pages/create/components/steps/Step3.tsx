// Step3.tsx - FULLY RESPONSIVE (mobile + desktop) WITH ALL FUNCTIONALITIES
import { QuestionTypeSelector } from "../../../../components/ui/question-type-selector";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  FileQuestion,
  Plus,
  GripVertical,
  Layers,
  Grid3x3,
  List,
  Settings2,
  ChevronLeft,
  X,
  SlidersHorizontal,
  Search,
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
  leftPanelTab: "types" | "bulk";
  setLeftPanelTab: (tab: "types" | "bulk") => void;
  activeTab: "workspace" | "preview";
  setActiveTab: (tab: "workspace" | "preview") => void;
  activeDragId: string | null;
  setActiveDragId: (id: string | null) => void;
  saveStatus: "idle" | "saving" | "saved";
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
  onReorderSelectedQuestions: (
    direction: "up" | "down" | "top" | "bottom"
  ) => void;
  onDuplicateCurrentQuestion: () => void;
  onDeleteCurrentQuestion: () => void;
  onQuickAction: (action: string) => void;
  onManualSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

// ─── MobileBottomSheet ────────────────────────────────────────────────────────
// Defined at module level (outside Step3) so React always sees the same
// component type across re-renders. If it were defined inside Step3 or inside
// renderMobile(), React would treat it as a new component on every render,
// causing it to unmount/remount and losing all child state (e.g. the active
// tab inside QuestionSidePanel resetting to "edit").
const MobileBottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <>
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
    )}
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}
      style={{ maxHeight: "88vh" }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-slate-200 rounded-full" />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      {/* Scrollable content */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(88vh - 90px)" }}
      >
        {children}
      </div>
    </div>
  </>
);

// ─── Main Step3 Component ─────────────────────────────────────────────────
export function Step3({
  context,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  selectedQuestions,
  leftPanelTab,
  setLeftPanelTab,
  activeDragId,
  setActiveDragId,
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
}: Step3Props) {
  // Desktop state
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Mobile state
  const [mobileSheet, setMobileSheet] = useState<
    "none" | "add" | "edit" | "bulk"
  >("none");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
      const oldIndex = context.questions.findIndex((q) => q.id === active.id);
      const newIndex = context.questions.findIndex((q) => q.id === over.id);
      onReorderQuestions(arrayMove(context.questions, oldIndex, newIndex));
    }
    setActiveDragId(null);
  };

  const filteredQuestions = context.questions.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: context.questions.length,
    withTimeLimit: context.questions.filter((q) => q.timeLimit).length,
    totalPoints: context.questions.reduce((sum, q) => sum + (q.points || 0), 0),
    avgTime: Math.round(
      context.questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0) /
        (context.questions.length || 1)
    ),
  };

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────
  const renderMobile = () => (
    <div className="flex flex-col h-full md:hidden">
      {/* Mobile Top Bar */}
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm z-20 shrink-0">
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">Q</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                Question Studio
              </p>
              <p className="text-[9px] text-slate-400">
                {stats.total} {stats.total === 1 ? "question" : "questions"} ·{" "}
                {stats.totalPoints} pts
              </p>
            </div>
          </div>

          {/* Search toggle */}
          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
              mobileSearchOpen
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-500"
            )}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-400"
              )}
            >
              <List className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-400"
              )}
            >
              <Grid3x3 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Collapsible search */}
        {mobileSearchOpen && (
          <div className="px-3 pb-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Question List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 bg-[#F8FAFC]">
        {context.questions.length === 0 ? (
          <div className="flex items-center justify-center h-full py-16">
            <div className="text-center max-w-xs mx-auto px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-50" />
                <div className="relative w-16 h-16 mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center">
                  <FileQuestion className="w-7 h-7 text-slate-300" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Empty Canvas
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Tap the button below to add your first question.
              </p>
              <button
                onClick={() => setMobileSheet("add")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add First Question
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Count row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {filteredQuestions.length}{" "}
                {filteredQuestions.length === 1 ? "item" : "items"}
                {searchQuery && (
                  <span className="ml-1 text-indigo-500">· "{searchQuery}"</span>
                )}
              </span>
              <span className="text-[10px] text-slate-400">Drag to reorder</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={context.questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={cn(
                    "space-y-2",
                    viewMode === "grid" && "grid grid-cols-2 gap-2 space-y-0"
                  )}
                >
                  {filteredQuestions.map((question) => {
                    const originalIndex = context.questions.findIndex(
                      (q) => q.id === question.id
                    );
                    return (
                      <SortableQuestionCard
                        key={question.id}
                        id={question.id}
                        question={question}
                        index={originalIndex}
                        isCurrent={currentQuestionIndex === originalIndex}
                        isSelected={selectedQuestions.includes(originalIndex)}
                        onQuestionClick={(idx) => {
                          setCurrentQuestionIndex(idx);
                          setMobileSheet("edit");
                        }}
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
                        {
                          context.questions.find((q) => q.id === activeDragId)
                            ?.title
                        }
                      </span>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>

            {/* Add more */}
            <button
              onClick={() => setMobileSheet("add")}
              className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 bg-white/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Add question
              </span>
            </button>
          </>
        )}
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => setMobileSheet("add")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
        <button
          onClick={() => currentQuestion && setMobileSheet("edit")}
          disabled={!currentQuestion}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all",
            currentQuestion
              ? "border-slate-200 text-slate-600 hover:bg-slate-50"
              : "border-slate-100 text-slate-300 cursor-not-allowed"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => setMobileSheet("bulk")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Bulk
        </button>
      </div>

      {/* ── Add Question Sheet ── */}
      <MobileBottomSheet
        isOpen={mobileSheet === "add"}
        onClose={() => setMobileSheet("none")}
        title="Add Question"
      >
        <div className="p-4">
          <QuestionTypeSelector
            onSelect={(type) => {
              onAddQuestion(type);
              setMobileSheet("edit");
            }}
            selectedType={currentQuestion?.uiType || currentQuestion?.type}
          />
        </div>
      </MobileBottomSheet>

      {/* ── Edit Sheet ── */}
      <MobileBottomSheet
        isOpen={mobileSheet === "edit"}
        onClose={() => setMobileSheet("none")}
        title={currentQuestion ? "Edit Question" : "No Question Selected"}
      >
        <QuestionSidePanel
          inline
          currentQuestion={currentQuestion}
          onUpdateQuestion={(updates) => {
            if (currentQuestionIndex >= 0 && context.questions[currentQuestionIndex]) {
              onUpdateQuestion(context.questions[currentQuestionIndex].id, updates);
            }
          }}
          onDuplicateQuestion={() => {
            onDuplicateCurrentQuestion();
            setMobileSheet("none");
          }}
          onDeleteQuestion={() => {
            onDeleteCurrentQuestion();
            setMobileSheet("none");
          }}
          isOpen={true}
          onToggle={() => setMobileSheet("none")}
        />
      </MobileBottomSheet>

      {/* ── Bulk Actions Sheet ── */}
      <MobileBottomSheet
        isOpen={mobileSheet === "bulk"}
        onClose={() => setMobileSheet("none")}
        title="Bulk Actions"
      >
        <div className="p-4">
          {/* Tab switcher */}
          <div className="relative flex bg-slate-100 rounded-xl p-1 mb-4">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-200 ease-out"
              style={{
                left: leftPanelTab === "types" ? "4px" : "calc(50% + 2px)",
                width: "calc(50% - 4px)",
              }}
            />
            <button
              onClick={() => setLeftPanelTab("types")}
              className={cn(
                "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors rounded-lg",
                leftPanelTab === "types"
                  ? "text-indigo-600"
                  : "text-slate-500"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Add Types</span>
            </button>
            <button
              onClick={() => setLeftPanelTab("bulk")}
              className={cn(
                "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors rounded-lg",
                leftPanelTab === "bulk"
                  ? "text-indigo-600"
                  : "text-slate-500"
              )}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Bulk Edit</span>
            </button>
          </div>

          {leftPanelTab === "types" ? (
            <QuestionTypeSelector
              onSelect={(type) => {
                onAddQuestion(type);
                setMobileSheet("none");
              }}
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
      </MobileBottomSheet>
    </div>
  );

  // ─── DESKTOP LAYOUT ─────────────────────────────────────────────────────
  const renderDesktop = () => (
    <div className="hidden md:flex h-full flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm z-20 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Question Studio
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">
                  {stats.total}{" "}
                  {stats.total === 1 ? "question" : "questions"} •{" "}
                  {stats.totalPoints} pts total
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500 font-medium">
                  Avg {stats.avgTime}s
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-slate-500 font-medium">
                  {stats.withTimeLimit} timed
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "grid"
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
              <ChevronLeft
                className={cn(
                  "w-4 h-4 transition-transform",
                  isPanelCollapsed && "rotate-180"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex relative overflow-hidden bg-[#F8FAFC]">
        {/* Left Panel */}
        <div
          className={cn(
            "h-full border-r border-slate-200 bg-white/50 backdrop-blur-sm transition-all duration-300 overflow-y-auto",
            isPanelCollapsed ? "w-0 overflow-hidden border-r-0" : "w-72 lg:w-80"
          )}
        >
          <div className="p-5">
            <div className="relative flex bg-slate-100 rounded-xl p-1 mb-6">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-200 ease-out"
                style={{
                  left: leftPanelTab === "types" ? "4px" : "calc(50% + 2px)",
                  width: "calc(50% - 4px)",
                }}
              />
              <button
                onClick={() => setLeftPanelTab("types")}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors rounded-lg",
                  leftPanelTab === "types"
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              <button
                onClick={() => setLeftPanelTab("bulk")}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors rounded-lg",
                  leftPanelTab === "bulk"
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Bulk</span>
              </button>
            </div>

            {leftPanelTab === "types" ? (
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

        {/* Center Workspace */}
        <div
          className={cn(
            "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-full",
            isSidePanelOpen ? "mr-[452px]" : "mr-[92px]"
          )}
        >
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 lg:px-6 py-5"
          >
            {context.questions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-50" />
                    <div className="relative w-24 h-24 mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center">
                      <FileQuestion className="w-10 h-10 text-slate-300" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    Empty Canvas
                  </h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                    Your question bank is empty. Start by adding your first
                    question.
                  </p>
                  <button
                    onClick={() => {
                      if (isPanelCollapsed) setIsPanelCollapsed(false);
                      setLeftPanelTab("types");
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {filteredQuestions.length}{" "}
                      {filteredQuestions.length === 1 ? "item" : "items"}
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

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={context.questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      className={cn(
                        "space-y-3",
                        viewMode === "grid" &&
                          "grid grid-cols-1 lg:grid-cols-2 gap-4 space-y-0"
                      )}
                    >
                      {filteredQuestions.map((question) => {
                        const originalIndex = context.questions.findIndex(
                          (q) => q.id === question.id
                        );
                        return (
                          <SortableQuestionCard
                            key={question.id}
                            id={question.id}
                            question={question}
                            index={originalIndex}
                            isCurrent={currentQuestionIndex === originalIndex}
                            isSelected={selectedQuestions.includes(
                              originalIndex
                            )}
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
                            {
                              context.questions.find(
                                (q) => q.id === activeDragId
                              )?.title
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>

                <button
                  onClick={() => {
                    if (isPanelCollapsed) setIsPanelCollapsed(false);
                    setLeftPanelTab("types");
                  }}
                  className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 bg-white/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Add another question
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side Panel (desktop only) */}
        <QuestionSidePanel
          currentQuestion={currentQuestion}
          onUpdateQuestion={(updates) => {
            if (currentQuestionIndex >= 0) {
              onUpdateQuestion(
                context.questions[currentQuestionIndex].id,
                updates
              );
            }
          }}
          onDuplicateQuestion={onDuplicateCurrentQuestion}
          onDeleteQuestion={onDeleteCurrentQuestion}
          isOpen={isSidePanelOpen}
          onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)}
        />
      </div>

      {/* Desktop Quick Actions FAB */}
      <QuickActionsPanel
        questions={context.questions}
        currentQuestionIndex={currentQuestionIndex}
        onAddQuestion={onAddQuestion}
        onDuplicateQuestion={onDuplicateCurrentQuestion}
        onDeleteQuestion={onDeleteCurrentQuestion}
        onUpdateQuestion={(updates) => {
          if (currentQuestionIndex >= 0) {
            onUpdateQuestion(
              context.questions[currentQuestionIndex].id,
              updates
            );
          }
        }}
        onBulkAction={onQuickAction}
      />
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-white to-slate-50/50 overflow-hidden flex flex-col">
      {renderMobile()}
      {renderDesktop()}
    </div>
  );
}
