import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useContexts } from '../../lib/mock-data';
import { Button } from '../../components/ui/button';
import { Plus, Grid3x3, List, FileText, Square, CheckSquare, Search } from 'lucide-react';
import ContextCard from './components/ContextCard';
import FilterPanel from './components/FilterPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import BulkActionsBar from './components/BulkActionsBar';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { type Context, type ContextStatus } from '../../lib/types';

// Extended type for UI display
interface DisplayContext extends Context {
  questionCount: number;
  sessionCount: number;
  lastModified: string;
  displayStatus: 'published' | 'draft';
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { contexts, deleteContext } = useContexts();
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<DisplayContext | null>(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const myContexts: DisplayContext[] = contexts.filter(c => c.creatorId === user.id).map(c => ({
    ...c,
    questionCount: c.questions?.length || 0,
    sessionCount: Math.floor(Math.random() * 10) + 1, // Mock data
    lastModified: c.updatedAt || c.createdAt,
    displayStatus: c.status === 'ACTIVE' ? 'published' : 'draft',
  }));

  const filteredContexts = useMemo(() => {
    return myContexts.filter((context) => {
      const matchesSearch = context.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                          context.description?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesStatus = statusFilter === 'all' || context.displayStatus === statusFilter;
      const matchesType = typeFilter === 'all' || context.type === typeFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        const modifiedDate = new Date(context.lastModified || context.createdAt);

        switch (dateFilter) {
          case 'today':
            matchesDate = modifiedDate?.toDateString() === now?.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = modifiedDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = modifiedDate >= monthAgo;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchesDate = modifiedDate >= yearAgo;
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [searchQuery, statusFilter, dateFilter, typeFilter, myContexts]);

  const handleSelectContext = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredContexts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContexts.map((c) => c.id));
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setTypeFilter('all');
  };

  const handleEdit = (id: string) => {
    navigate(`/create?edit=${id}`);
  };

  const handleDeleteSingle = (id: string) => {
    setDeleteIds([id]);
    setDeleteModalOpen(true);
  };

  const handleDeleteBulk = () => {
    setDeleteIds(selectedIds);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteIds.forEach(id => deleteContext(id));
    setDeleteModalOpen(false);
    setDeleteIds([]);
    setSelectedIds([]);
  };

  const handleExport = () => {
    console.log('Exporting contexts:', selectedIds);
  };

  const handleViewAnalytics = (id: string) => {
    const context = myContexts.find((c) => c.id === id);
    if (context) {
      setSelectedContext(context);
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto py-6 md:py-8 lg:py-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your quizzes, polls, and games.
          </p>
        </div>
        <Button size="lg" icon="Plus" iconPosition="left" onClick={() => navigate('/create')}>
          Create New
        </Button>
      </div>

      {/* Search and view controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 bg-card p-2 rounded-lg border shadow-sm max-w-md w-full">
          <Search className="h-4 w-4 text-muted-foreground ml-2" />
          <input
            placeholder="Search your contexts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card rounded-lg border border-border p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md transition-all duration-150 ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-md transition-all duration-150 ${
                viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {filteredContexts.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors duration-150 text-sm font-medium text-foreground"
            >
              {selectedIds.length === filteredContexts.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedIds.length === filteredContexts.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
            <FileText className="h-4 w-4" />
            <span>{filteredContexts.length} {filteredContexts.length === 1 ? 'context' : 'contexts'}</span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Filter panel */}
        <div className="lg:col-span-3">
          <FilterPanel
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            onClearFilters={handleClearFilters}
            isCollapsed={isFilterCollapsed}
            onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
          />
        </div>

        {/* Content area */}
        <div className="lg:col-span-9">
          {filteredContexts.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 md:p-12 lg:p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
                No Contexts Found
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters or search query to find what you\'re looking for.'
                  : 'Get started by creating your first interactive context.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all' || typeFilter !== 'all') && (
                  <Button variant="outline" icon="X" iconPosition="left" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Button icon="Plus" iconPosition="left" onClick={() => navigate('/create')}>
                  Create Context
                </Button>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
                  {filteredContexts.map((context) => (
                    <ContextCard
                      key={context.id}
                      context={context}
                      onDelete={() => handleDeleteSingle(context.id)}
                      onSelect={handleSelectContext}
                      isSelected={selectedIds.includes(context.id)}
                      onAnalytics={handleViewAnalytics}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left w-10">
                            <div className="w-6 h-6" />
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                            Context
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground hidden md:table-cell">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground hidden lg:table-cell">
                            Questions
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground hidden lg:table-cell">
                            Participants
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground hidden md:table-cell">
                            Last Modified
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContexts.map((context) => (
                          <tr
                            key={context.id}
                            className={`border-b border-border last:border-b-0 transition-colors duration-150 ${
                              selectedIds.includes(context.id) ? 'bg-primary/5' : 'hover:bg-muted/50'
                            }`}
                          >
                            <td className="px-4 py-4">
                              <button
                                onClick={() => handleSelectContext(context.id)}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-250 ${
                                  selectedIds.includes(context.id)
                                    ? 'bg-primary border-primary'
                                    : 'bg-white border-gray-300 hover:border-primary dark:bg-gray-800 dark:border-gray-600'
                                }`}
                                aria-label={selectedIds.includes(context.id) ? 'Deselect context' : 'Select context'}
                              >
                                {selectedIds.includes(context.id) && (
                                  <CheckSquare className="h-4 w-4 text-white" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                                  {context.coverImage ? (
                                    <img src={context.coverImage} alt={context.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                      <span className="text-xl opacity-20 font-bold">{context.type[0]}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground line-clamp-1">
                                    {context.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Created {new Date(context.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                                context.type === 'QUIZ' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                context.type === 'POLL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                context.type === 'VOTE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              }`}>
                                {context.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <span className="text-sm text-foreground">{context.questionCount || 0}</span>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <span className="text-sm text-foreground">{context.participantsCount}</span>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {new Date(context.lastModified || context.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                                context.displayStatus === 'published' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}>
                                {context.displayStatus === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  icon="Edit"
                                  onClick={() => handleEdit(context.id)}
                                  aria-label="Edit context"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  icon="Trash2"
                                  onClick={() => handleDeleteSingle(context.id)}
                                  aria-label="Delete context"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Analytics Panel */}
              <div className="mt-6 md:mt-8">
                <AnalyticsPanel context={selectedContext || filteredContexts[0]} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onExport={handleExport}
        onDelete={handleDeleteBulk}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <DeleteConfirmModal
          count={deleteIds.length}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeleteIds([]);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;