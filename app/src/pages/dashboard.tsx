import { useContexts, useAuth, type Context, type ContextType } from "../lib/mock-data";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Play, 
  Edit, 
  BarChart, 
  Users,
  Calendar,
  Clock
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { contexts, deleteContext } = useContexts();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const myContexts = contexts.filter(c => c.creatorId === user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your quizzes, polls, and games.</p>
        </div>
        <Link to="/create">
          <Button size="lg" className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border shadow-sm max-w-md">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search your contexts..." 
          className="border-0 focus-visible:ring-0 shadow-none bg-transparent" 
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myContexts.map(context => (
          <ContextCard 
            key={context.id} 
            context={context} 
            onDelete={() => deleteContext(context.id)}
          />
        ))}
        
        {myContexts.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50">
              <Plus className="h-full w-full" />
            </div>
            <h3 className="font-heading font-semibold text-lg">No contexts yet</h3>
            <p className="text-muted-foreground mb-4">Create your first quiz or poll to get started.</p>
            <Link to="/create">
              <Button>Create Now</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ContextCard({ context, onDelete }: { context: Context, onDelete: () => void }) {
  const navigate = useNavigate();

  const typeColors: Record<ContextType, string> = {
    'QUIZ': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'POLL': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'VOTE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'GAME': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };

  return (
    <div className="group relative flex flex-col bg-card rounded-xl border shadow-sm transition-all hover:shadow-md overflow-hidden h-full">
      <div className="relative h-32 w-full bg-muted overflow-hidden">
        {context.coverImage ? (
          <img src={context.coverImage} alt={context.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-muted to-muted/50 flex items-center justify-center">
            <span className="text-4xl opacity-20 font-heading font-bold">{context.type[0]}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={typeColors[context.type] || 'bg-secondary'}>
            {context.type}
          </Badge>
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
              <DropdownMenuItem onClick={() => navigate(`/results/${context.id}`)}>
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

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{context.participantsCount}</span>
          </div>
          <div className="flex items-center gap-1" title={new Date(context.createdAt).toLocaleString()}>
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(context.createdAt))} ago</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/results/${context.id}`)}>
            <BarChart className="mr-2 h-3 w-3" /> Results
          </Button>
          <Button size="sm" className="w-full" onClick={() => navigate(`/session/${context.id}/host`)}>
            <Play className="mr-2 h-3 w-3" /> Present
          </Button>
        </div>
      </div>
    </div>
  );
}