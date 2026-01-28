import { useEffect, useRef, useState } from 'react';
import { BarChart3, MessageSquare, ThumbsUp, Users, Zap } from 'lucide-react';

interface VoteOption {
  label: string;
  votes: number;
  color: string;
}

interface ChatMessage {
  id: number;
  name: string;
  message: string;
  avatar: string;
}

export function LivePreviewMockup() {
  const [votes, setVotes] = useState<VoteOption[]>([
    { label: 'Option A', votes: 45, color: 'bg-violet-500' },
    { label: 'Option B', votes: 32, color: 'bg-pink-500' },
    { label: 'Option C', votes: 23, color: 'bg-blue-500' },
  ]);
  const [participantCount, setParticipantCount] = useState(128);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, name: 'Sarah', message: 'Great presentation! 🎉', avatar: 'S' },
    { id: 2, name: 'Mike', message: 'Love the interactive features', avatar: 'M' },
    { id: 3, name: 'Emma', message: 'This is so engaging!', avatar: 'E' },
  ]);
  const [activeTab, setActiveTab] = useState<'poll' | 'chat' | 'quiz'>('poll');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Simulate live vote updates
    intervalRef.current = setInterval(() => {
      setVotes(prev => {
        const newVotes = [...prev];
        const randomIndex = Math.floor(Math.random() * newVotes.length);
        newVotes[randomIndex] = {
          ...newVotes[randomIndex],
          votes: newVotes[randomIndex].votes + Math.floor(Math.random() * 3),
        };
        return newVotes;
      });

      setParticipantCount(prev => prev + Math.floor(Math.random() * 2));
    }, 2000);

    // Add new messages periodically
    const messageInterval = setInterval(() => {
      const newMessages = [
        { name: 'Alex', message: 'Voted! ✓', avatar: 'A' },
        { name: 'Jordan', message: 'Awesome tool 🔥', avatar: 'J' },
        { name: 'Taylor', message: 'So easy to use!', avatar: 'T' },
        { name: 'Casey', message: 'Real-time is amazing', avatar: 'C' },
      ];
      const randomMsg = newMessages[Math.floor(Math.random() * newMessages.length)];
      
      setMessages(prev => {
        const newMessage = { ...randomMsg, id: Date.now() };
        return [...prev.slice(-4), newMessage];
      });
    }, 3500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(messageInterval);
    };
  }, []);

  const totalVotes = votes.reduce((sum, v) => sum + v.votes, 0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Mockup Container */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-500 dark:text-slate-400 text-center font-mono">
              engagelive.app/session/ABC123
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-4 h-4" />
            <span className="font-mono tabular-nums">{participantCount}</span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="absolute top-14 right-4 flex items-center gap-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full" />
          LIVE
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'poll', label: 'Live Poll', icon: BarChart3 },
              { id: 'chat', label: 'Q&A', icon: MessageSquare },
              { id: 'quiz', label: 'Quiz', icon: Zap },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Poll View */}
          {activeTab === 'poll' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Which feature do you like most?
              </h4>
              <div className="space-y-3">
                {votes.map((option, i) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  return (
                    <div key={i} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {option.label}
                        </span>
                        <span className="text-sm text-slate-500 tabular-nums">
                          {option.votes} votes ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                        <div
                          className={`absolute inset-y-0 left-0 ${option.color} transition-all duration-500 ease-out flex items-center px-3`}
                          style={{ width: `${percentage}%` }}
                        >
                          <ThumbsUp className="w-4 h-4 text-white/80" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">
                Total votes: <span className="font-mono font-bold">{totalVotes}</span>
              </p>
            </div>
          )}

          {/* Chat View */}
          {activeTab === 'chat' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Live Q&A
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-in slide-in-from-left-2 duration-300"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {msg.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                        {msg.name}
                      </p>
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz View */}
          {activeTab === 'quiz' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Quick Quiz: What is 2 + 2?
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {['3', '4', '5', '22'].map((answer, i) => (
                  <button
                    key={i}
                    className={`p-4 rounded-lg border-2 text-center font-medium transition-all hover:scale-105 ${
                      answer === '4'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    {answer}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Time remaining: 15s</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Stats Bar */}
        <div className="flex items-center justify-around px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          {[
            { label: 'Active', value: `${participantCount}`, icon: Users },
            { label: 'Responses', value: `${totalVotes}`, icon: BarChart3 },
            { label: 'Engagement', value: '94%', icon: Zap },
          ].map(({ label, value, icon: Icon }, i) => (
            <div key={i} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-slate-400" />
              <div className="text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="ml-1 font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-accent/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
}