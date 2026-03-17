import React from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onClearFilters: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  typeFilter,
  onTypeChange,
  onClearFilters,
  isCollapsed,
  onToggleCollapse,
}) => {
  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || typeFilter !== 'all' || searchQuery;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 md:p-5 lg:p-6 border-b border-border lg:border-b-0">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-base md:text-lg font-semibold text-foreground">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors duration-150"
          aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      <div className={`p-4 md:p-5 lg:p-6 space-y-4 ${isCollapsed ? 'hidden lg:block' : 'block'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contexts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date Range</label>
          <Select value={dateFilter} onValueChange={onDateChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Type</label>
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="POLL">Poll</SelectItem>
              <SelectItem value="VOTE">Vote</SelectItem>
              <SelectItem value="GAME">Game</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;