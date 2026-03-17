import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Play, Edit, BarChart, Users, Clock, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { type Context } from '../../../lib/types';

interface ContextCardProps {
  context: Context & { 
    questionCount?: number; 
    sessionCount?: number; 
    lastModified?: string; 
    displayStatus?: 'published' | 'draft' 
  };
  onDelete: () => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  onAnalytics?: (id: string) => void;
}

const ContextCard: React.FC<ContextCardProps> = ({ 
  context, 
  onDelete, 
  onSelect,
  isSelected,
  onAnalytics 
}) => {
  const navigate = useNavigate();

  const typeColors: Record<string, { bg: string; text: string; variant: 'purple' | 'blue' | 'green' | 'orange' }> = {
    'QUIZ': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', variant: 'purple' },
    'POLL': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', variant: 'blue' },
    'VOTE': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', variant: 'green' },
    'GAME': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', variant: 'orange' },
  };

  const typeColor = typeColors[context.type] || typeColors['QUIZ'];

  const handleAnalytics = () => {
    if (onAnalytics) {
      onAnalytics(context.id);
    } else {
      navigate(`/results/${context.id}`);
    }
  };

  const displayStatus = context.displayStatus || (context.status === 'ACTIVE' ? 'published' : 'draft');

  return (
    <div className={`group relative flex flex-col bg-card rounded-xl border transition-all duration-250 overflow-hidden h-full ${
      isSelected ? 'border-primary shadow-lg' : 'border-border hover:shadow-md'
    }`}>
      <div className="relative h-32 w-full bg-muted overflow-hidden">
        {context.coverImage ? (
          <img 
            src={context.coverImage} 
            alt={context.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <span className="text-4xl opacity-20 font-heading font-bold">{context.type[0]}</span>
          </div>
        )}
        
        {/* Selection checkbox */}
        {onSelect && (
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(context.id);
              }}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-250 ${
                isSelected 
                  ? 'bg-primary border-primary' 
                  : 'bg-white border-gray-300 hover:border-primary dark:bg-gray-800 dark:border-gray-600'
              }`}
              aria-label={isSelected ? 'Deselect context' : 'Select context'}
            >
              {isSelected && <CheckSquare className="h-4 w-4 text-white" />}
            </button>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium ${
          displayStatus === 'published' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        }`}>
          {displayStatus === 'published' ? 'Published' : 'Draft'}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-bold text-lg leading-tight line-clamp-2" title={context.title}>
            {context.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/create?edit=${context.id}`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAnalytics}>
                <BarChart className="mr-2 h-4 w-4" /> Results
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {context.description || "No description provided."}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 mb-3">
          {context.questionCount !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
              <BarChart className="h-3 w-3" />
              {context.questionCount} questions
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {context.participantsCount} participants
          </span>
          {context.sessionCount !== undefined && context.sessionCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
              <BarChart className="h-3 w-3" />
              {context.sessionCount} sessions
            </span>
          )}
        </div>

        <div className="space-y-2 mb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2" title={new Date(context.createdAt).toLocaleString()}>
            <Clock className="h-3 w-3" />
            <span>Created {formatDistanceToNow(new Date(context.createdAt))} ago</span>
          </div>
          {context.lastModified && (
            <div className="flex items-center gap-2" title={new Date(context.lastModified).toLocaleString()}>
              <Clock className="h-3 w-3" />
              <span>Modified {formatDistanceToNow(new Date(context.lastModified))} ago</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="outline" size="sm" className="w-full" onClick={handleAnalytics}>
            <BarChart className="mr-2 h-3 w-3" /> Results
          </Button>
          <Button size="sm" className="w-full shadow-lg shadow-primary/20" onClick={() => navigate(`/session/${context.id}/host`)}>
            <Play className="mr-2 h-3 w-3" /> Present
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContextCard;